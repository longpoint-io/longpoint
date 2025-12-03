import { AssetVariantType } from '@/database';
import { PrismaService } from '@/modules/common/services';
import { UrlSigningService } from '@/modules/file-delivery';
import { SupportedMimeType } from '@longpoint/types';
import { mimeTypeToExtension } from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import { GenerateMediaLinksDto } from '../dtos/generate-links.dto';

@Injectable()
export class AssetLinkGeneratorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly urlSigningService: UrlSigningService
  ) {}

  async generateLinks(body: GenerateMediaLinksDto) {
    const assets = await this.prismaService.asset.findMany({
      where: {
        id: {
          in: body.assets.map((asset) => asset.assetId),
        },
      },
      select: {
        id: true,
        variants: {
          where: {
            variant: AssetVariantType.PRIMARY,
          },
          select: {
            mimeType: true,
          },
        },
      },
    });

    const assetMap = new Map<string, { mimeType: string }>(
      assets.map((asset) => [
        asset.id,
        { mimeType: asset.variants[0]?.mimeType ?? '' },
      ])
    );

    const links = body.assets.reduce((acc, assetOptions) => {
      const assetData = assetMap.get(assetOptions.assetId);

      if (!assetData?.mimeType) {
        return acc;
      }

      const filename = `primary.${mimeTypeToExtension(
        assetData.mimeType as SupportedMimeType
      )}`;
      const link = this.urlSigningService.generateSignedUrl(
        assetOptions.assetId,
        filename,
        assetOptions
      );
      return { ...acc, [assetOptions.assetId]: link };
    }, {} as Record<string, string>);
    return links;
  }
}
