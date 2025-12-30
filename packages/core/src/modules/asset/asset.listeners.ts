import { JsonObject } from '@/shared/types/object.types';
import { ClassifyResult } from '@longpoint/devkit';
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
          asset: {
            select: {
              id: true,
              metadata: true,
            },
          },
        },
      });

      if (!variant) {
        this.logger.warn(
          `Asset variant ${payload.assetVariantId} not found for metadata merge`
        );
        return;
      }

      const result = payload.result as ClassifyResult;

      // Prepare variant update data
      const variantUpdateData: {
        width?: number;
        height?: number;
        duration?: number;
        metadata?: JsonObject;
      } = {};

      if (result.variant) {
        if (result.variant.width !== undefined) {
          variantUpdateData.width = result.variant.width;
        }
        if (result.variant.height !== undefined) {
          variantUpdateData.height = result.variant.height;
        }
        if (result.variant.duration !== undefined) {
          variantUpdateData.duration = result.variant.duration;
        }
        if (result.variant.metadata) {
          const currentVariantMetadata =
            (variant.metadata as JsonObject | null) ?? ({} as JsonObject);
          variantUpdateData.metadata = {
            ...currentVariantMetadata,
            ...(result.variant.metadata as JsonObject),
          };
        }
      }

      // Prepare asset update data
      const assetUpdateData: {
        name?: string;
        metadata?: JsonObject;
      } = {};

      if (result.asset) {
        if (result.asset.name !== undefined) {
          assetUpdateData.name = result.asset.name;
        }
        if (result.asset.metadata) {
          const currentAssetMetadata =
            (variant.asset.metadata as JsonObject | null) ?? ({} as JsonObject);
          assetUpdateData.metadata = {
            ...currentAssetMetadata,
            ...(result.asset.metadata as JsonObject),
          };
        }
      }

      await this.prismaService.assetVariant.update({
        where: { id: payload.assetVariantId },
        data: {
          ...variantUpdateData,
          ...(Object.keys(assetUpdateData).length > 0
            ? {
                asset: {
                  update: assetUpdateData,
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
