import { AssetVariantType } from '@/database';
import { PrismaService } from '@/modules/common/services';
import { UrlSigningService } from '@/modules/file-delivery';
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
            type: AssetVariantType.ORIGINAL,
          },
          select: {
            id: true,
            entryPoint: true,
            mimeType: true,
          },
        },
      },
    });

    const assetMap = new Map<
      string,
      { id: string; entryPoint: string; mimeType: string }
    >(
      assets.map((asset) => [
        asset.id,
        {
          id: asset.variants[0]?.id ?? '',
          entryPoint: asset.variants[0]?.entryPoint ?? '',
          mimeType: asset.variants[0]?.mimeType ?? '',
        },
      ])
    );

    const links = body.assets.reduce((acc, assetOptions) => {
      const assetData = assetMap.get(assetOptions.assetId);

      if (!assetData?.mimeType) {
        return acc;
      }

      const link = this.urlSigningService.generateSignedUrl(
        assetData.id,
        assetData.entryPoint,
        assetOptions
      );
      return { ...acc, [assetOptions.assetId]: link };
    }, {} as Record<string, string>);
    return links;
  }
}
