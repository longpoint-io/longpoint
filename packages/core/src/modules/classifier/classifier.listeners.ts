import { Injectable, Logger } from '@nestjs/common';
import { AssetEventKey, type AssetVariantReadyEventPayload } from '../asset';
import { PrismaService } from '../common/services';
import { HandleEvent } from '../event';
import { ClassifierTemplateService } from './services/classifier-template.service';

@Injectable()
export class ClassifierListeners {
  private readonly logger = new Logger(ClassifierListeners.name);

  constructor(
    private readonly classifierTemplateService: ClassifierTemplateService,
    private readonly prismaService: PrismaService
  ) {}

  @HandleEvent(AssetEventKey.ASSET_VARIANT_READY)
  async handleAssetVariantReady(payload: AssetVariantReadyEventPayload) {
    const variant = await this.prismaService.assetVariant.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        classifiersOnUpload: true,
        assetId: true,
      },
    });

    if (!variant || variant.classifiersOnUpload.length === 0) {
      return;
    }

    const classifierTemplates =
      await this.classifierTemplateService.listClassifierTemplates();
    const entities = classifierTemplates.filter((classifierTemplate) =>
      variant.classifiersOnUpload.includes(classifierTemplate.name)
    );

    // Run classifiers in parallel (fire and forget - each one will publish its own completion event on success)
    Promise.all(entities.map((entity) => entity.run(variant.id))).catch(
      (error) => {
        // Log error but don't throw - we don't want to block the event handler
        this.logger.error(
          `Error running classifier templates for variant ${variant.id}:`,
          error
        );
      }
    );
  }
}
