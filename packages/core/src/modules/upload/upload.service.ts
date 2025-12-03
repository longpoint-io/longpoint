import {
  AssetStatus,
  AssetVariant,
  AssetVariantStatus,
  Prisma,
} from '@/database';
import { ConfigService, PrismaService } from '@/modules/common/services';
import { StorageUnitService } from '@/modules/storage';
import { SupportedMimeType } from '@longpoint/types';
import {
  getAssetPath,
  mimeTypeToAssetType,
  mimeTypeToExtension,
} from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import { isAfter } from 'date-fns';
import { Request } from 'express';
import { MediaProbeService } from '../common/services/media-probe/media-probe.service';
import { EventPublisher } from '../event';
import { UrlSigningService } from '../file-delivery/services/url-signing.service';
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

    const extension = mimeTypeToExtension(
      uploadToken.assetVariant.mimeType as SupportedMimeType
    );
    const fullPath = getAssetPath(assetId, {
      storageUnitId: uploadToken.assetVariant.asset.storageUnitId,
      prefix: this.configService.get('storage.pathPrefix'),
      suffix: `primary.${extension}`,
    });

    try {
      const provider = await storageUnit.getProvider();
      await provider.upload(fullPath, req);
      await this.finalize(fullPath, uploadToken.assetVariant);
    } catch (error) {
      await this.updateVariant(uploadToken.assetVariant.id, {
        status: 'FAILED',
      });
      throw error;
    }
  }

  private async finalize(
    fullPath: string,
    variant: Pick<AssetVariant, 'id' | 'assetId' | 'mimeType'>
  ) {
    try {
      // Extract filename from fullPath (format: {prefix}/{storageUnitId}/{assetId}/primary.{extension})
      const pathParts = fullPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      const url = this.urlSigningService.generateSignedUrl(
        variant.assetId,
        filename
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
