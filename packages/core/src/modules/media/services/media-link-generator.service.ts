import { MediaAssetVariant } from '@/database';
import { PrismaService } from '@/modules/common/services';
import { UrlSigningService } from '@/modules/file-delivery';
import { SupportedMimeType } from '@longpoint/types';
import { mimeTypeToExtension } from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import { GenerateMediaLinksDto } from '../dtos/generate-links.dto';

@Injectable()
export class MediaLinkGeneratorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly urlSigningService: UrlSigningService
  ) {}

  async generateLinks(body: GenerateMediaLinksDto) {
    const containers = await this.prismaService.mediaContainer.findMany({
      where: {
        id: {
          in: body.containers.map((container) => container.containerId),
        },
      },
      select: {
        id: true,
        assets: {
          where: {
            variant: MediaAssetVariant.PRIMARY,
          },
          select: {
            mimeType: true,
          },
        },
      },
    });

    const containerMap = new Map<string, { mimeType: string }>(
      containers.map((container) => [
        container.id,
        { mimeType: container.assets[0]?.mimeType ?? '' },
      ])
    );

    const links = body.containers.reduce((acc, containerOptions) => {
      const containerData = containerMap.get(containerOptions.containerId);

      if (!containerData?.mimeType) {
        return acc;
      }

      const filename = `primary.${mimeTypeToExtension(
        containerData.mimeType as SupportedMimeType
      )}`;
      const link = this.urlSigningService.generateSignedUrl(
        containerOptions.containerId,
        filename,
        containerOptions
      );
      return { ...acc, [containerOptions.containerId]: link };
    }, {} as Record<string, string>);
    return links;
  }
}
