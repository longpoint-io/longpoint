import { JsonObject } from '@/shared/types/object.types';
import { Injectable, Logger } from '@nestjs/common';
import type { ClassifierRunCompleteEventPayload } from '../../classifier';
import { PrismaService } from '../../common/services';
import { HandleEvent } from '../../event';

@Injectable()
export class MediaMetadataListeners {
  private readonly logger = new Logger(MediaMetadataListeners.name);

  constructor(private readonly prismaService: PrismaService) {}

  @HandleEvent('classifier.run.complete')
  async handleClassifierRunComplete(
    payload: ClassifierRunCompleteEventPayload
  ) {
    if (!payload.result) {
      return;
    }

    try {
      const asset = await this.prismaService.mediaAsset.findUnique({
        where: { id: payload.mediaAssetId },
        select: {
          id: true,
          metadata: true,
        },
      });

      if (!asset) {
        this.logger.warn(
          `Media asset ${payload.mediaAssetId} not found for metadata merge`
        );
        return;
      }

      const currentMetadata =
        (asset.metadata as JsonObject | null) ?? ({} as JsonObject);
      const mergedMetadata: JsonObject = {
        ...currentMetadata,
        ...(payload.result as JsonObject),
      };

      await this.prismaService.mediaAsset.update({
        where: { id: payload.mediaAssetId },
        data: {
          metadata: mergedMetadata,
        },
      });

      this.logger.debug(
        `Merged metadata from classifier "${payload.classifierName}" into asset ${payload.mediaAssetId}`
      );
    } catch (error) {
      this.logger.error(
        `Error merging metadata for asset ${payload.mediaAssetId}:`,
        error
      );
    }
  }
}
