import { JsonObject } from '@/shared/types/object.types';
import { Injectable, Logger } from '@nestjs/common';
import type { ClassifierRunCompleteEventPayload } from '../classifier';
import { PrismaService } from '../common/services';
import { HandleEvent } from '../event';

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
      const variant = await this.prismaService.assetVariant.findUnique({
        where: { id: payload.assetVariantId },
        select: {
          id: true,
          metadata: true,
        },
      });

      if (!variant) {
        this.logger.warn(
          `Asset variant ${payload.assetVariantId} not found for metadata merge`
        );
        return;
      }

      const currentMetadata =
        (variant.metadata as JsonObject | null) ?? ({} as JsonObject);
      const mergedMetadata: JsonObject = {
        ...currentMetadata,
        ...(payload.result as JsonObject),
      };

      await this.prismaService.assetVariant.update({
        where: { id: payload.assetVariantId },
        data: {
          metadata: mergedMetadata,
        },
      });

      this.logger.debug(
        `Merged metadata from classifier "${payload.classifierName}" into variant ${payload.assetVariantId}`
      );
    } catch (error) {
      this.logger.error(
        `Error merging metadata for variant ${payload.assetVariantId}:`,
        error
      );
    }
  }
}
