import {
  AssetStatus,
  AssetVariant,
  AssetVariantStatus,
  Prisma,
} from '@/database';
import { ConfigService, PrismaService } from '@/modules/common/services';
import { StorageUnitService } from '@/modules/storage';
import { getAssetVariantPath } from '@/shared/utils/asset.utils';
import { mimeTypeToAssetType } from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import { isAfter } from 'date-fns';
import { Request } from 'express';
import { MediaProbeService } from '../common/services/media-probe/media-probe.service';
import { EventPublisher } from '../event';
import { UrlSigningService } from '../file-delivery/services/url-signing.service';
import { StorageProviderEntity } from '../storage/entities';
import { UploadAssetQueryDto } from './dtos/upload-asset.dto';
import { TokenExpired } from './upload.errors';

@Injectable()
export class UploadService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageUnitService: StorageUnitService,
    private readonly probeService: MediaProbeService,
    private readonly configService: ConfigService,
    private readonly urlSigningService: UrlSigningService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async upload(assetId: string, query: UploadAssetQueryDto, req: Request) {
    const uploadToken = await this.prismaService.uploadToken.findUnique({
      where: {
        token: query.token,
      },
      select: {
        expiresAt: true,
        assetVariant: {
          select: {
            id: true,
            assetId: true,
            mimeType: true,
            type: true,
            entryPoint: true,
            classifiersOnUpload: true,
            asset: {
              select: {
                storageUnitId: true,
              },
            },
          },
        },
      },
    });

    if (!uploadToken || isAfter(new Date(), uploadToken.expiresAt)) {
      throw new TokenExpired();
    }

    const storageUnit = await this.storageUnitService.getStorageUnitByAssetId(
      assetId
    );

    await this.updateVariant(uploadToken.assetVariant.id, {
      status: 'PROCESSING',
    });

    const filePath = getAssetVariantPath({
      ...uploadToken.assetVariant,
      storageUnitId: uploadToken.assetVariant.asset.storageUnitId,
      prefix: this.configService.get('storage.pathPrefix'),
    });

    try {
      const provider = await storageUnit.getProvider();
      await provider.upload(filePath, req);
      await this.finalize(uploadToken.assetVariant, provider, storageUnit.id);
    } catch (error) {
      await this.updateVariant(uploadToken.assetVariant.id, {
        status: 'FAILED',
      });
      throw error;
    }
  }

  private async finalize(
    variant: Pick<AssetVariant, 'id' | 'assetId' | 'mimeType' | 'entryPoint'>,
    provider: StorageProviderEntity,
    storageUnitId: string
  ) {
    try {
      const url = this.urlSigningService.generateSignedUrl(
        variant.id,
        variant.entryPoint
      );
      const baseUrl = this.configService.get('server.baseUrl');
      const fullUrl = new URL(url, baseUrl).href;

      const assetType = mimeTypeToAssetType(variant.mimeType);

      let variantUpdateData: Prisma.AssetVariantUpdateInput = {};

      if (assetType === 'IMAGE') {
        const imageProbe = await this.probeService.probeImage(fullUrl);
        variantUpdateData = {
          width: imageProbe.width,
          height: imageProbe.height,
          aspectRatio: imageProbe.aspectRatio,
          size: imageProbe.size.bytes,
        };
      }

      const fileStats = await provider.getPathStats(
        getAssetVariantPath({
          ...variant,
          storageUnitId,
          prefix: this.configService.get('storage.pathPrefix'),
        })
      );
      variantUpdateData.size = fileStats.size;

      await this.updateVariant(variant.id, {
        ...variantUpdateData,
        status: 'READY',
        uploadToken: {
          delete: true,
        },
      });
      await this.eventPublisher.publish('asset.variant.ready', {
        id: variant.id,
        assetId: variant.assetId,
      });
    } catch (e) {
      await this.updateVariant(variant.id, {
        status: 'FAILED',
      });
      await this.eventPublisher.publish('asset.variant.failed', {
        id: variant.id,
        assetId: variant.assetId,
      });
      throw e;
    }
  }

  /**
   * Updates a variant and syncs the asset status
   * @param variantId
   * @param data
   */
  private async updateVariant(
    variantId: string,
    data: Prisma.AssetVariantUpdateInput
  ) {
    let assetId: string | null = null;
    let wasReady = false;
    let isReady = false;

    await this.prismaService.$transaction(async (tx) => {
      const updatedVariant = await tx.assetVariant.update({
        where: {
          id: variantId,
        },
        data,
        select: {
          assetId: true,
        },
      });

      assetId = updatedVariant.assetId;

      const asset = await tx.asset.findUnique({
        where: {
          id: assetId,
        },
        select: {
          status: true,
        },
      });

      wasReady = asset?.status === 'READY';

      const allVariantsForAsset = await tx.assetVariant.findMany({
        where: {
          assetId: updatedVariant.assetId,
        },
        select: {
          status: true,
        },
      });

      const statusBreakdown = Object.values(AssetVariantStatus).reduce(
        (acc, status) => {
          acc[status] = 0;
          return acc;
        },
        {} as Record<AssetVariantStatus, number>
      );

      for (const variant of allVariantsForAsset) {
        statusBreakdown[variant.status]++;
      }

      let assetStatus: AssetStatus = 'PROCESSING';

      const fullyReady =
        statusBreakdown['PROCESSING'] === 0 &&
        statusBreakdown['READY'] > 0 &&
        statusBreakdown['FAILED'] === 0;
      const completeFailure =
        statusBreakdown['PROCESSING'] === 0 &&
        statusBreakdown['READY'] === 0 &&
        statusBreakdown['FAILED'] > 0;
      const partialFailure =
        statusBreakdown['PROCESSING'] === 0 &&
        statusBreakdown['READY'] > 0 &&
        statusBreakdown['FAILED'] > 0;

      if (fullyReady) {
        assetStatus = 'READY';
      } else if (completeFailure) {
        assetStatus = 'FAILED';
      } else if (partialFailure) {
        assetStatus = 'PARTIALLY_FAILED';
      }

      isReady = assetStatus === 'READY';

      await tx.asset.update({
        where: {
          id: updatedVariant.assetId,
        },
        data: {
          status: assetStatus,
        },
      });
    });

    if (assetId && !wasReady && isReady) {
      await this.eventPublisher.publish('asset.ready', {
        assetId,
      });
    }
  }
}
