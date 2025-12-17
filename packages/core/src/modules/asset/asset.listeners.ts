import { JsonObject } from '@/shared/types/object.types';
import { ClassifyResult, KeyAssetMetadataField } from '@longpoint/devkit';
import { Injectable, Logger } from '@nestjs/common';
import {
  ClassifierEventKey,
  type ClassifierRunCompleteEventPayload,
} from '../classifier';
import { PrismaService } from '../common/services';
import { HandleEvent } from '../event';

@Injectable()
export class MediaMetadataListeners {
  private readonly logger = new Logger(MediaMetadataListeners.name);

  constructor(private readonly prismaService: PrismaService) {}

  @HandleEvent(ClassifierEventKey.CLASSIFIER_RUN_COMPLETE)
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

      // separate key metadata fields from the rest of the result
      const result = payload.result as ClassifyResult;
      const currentMetadata =
        (variant.metadata as JsonObject | null) ?? ({} as JsonObject);
      const mergedMetadata: JsonObject = {
        ...currentMetadata,
        ...Object.fromEntries(
          Object.entries(payload.result as JsonObject).filter(
            ([key]) =>
              !Object.values(KeyAssetMetadataField).includes(
                key as KeyAssetMetadataField
              )
          )
        ),
      };

      await this.prismaService.assetVariant.update({
        where: { id: payload.assetVariantId },
        data: {
          width: result.width,
          height: result.height,
          duration: result.duration,
          metadata: mergedMetadata,
          ...(result.assetName
            ? {
                asset: {
                  update: {
                    name: result.assetName,
                  },
                },
              }
            : {}),
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
