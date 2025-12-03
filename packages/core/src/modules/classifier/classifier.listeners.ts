import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services';
import { HandleEvent } from '../event';
import type { AssetVariantReadyEventPayload } from '../media';
import { ClassifierService } from './classifier.service';

@Injectable()
export class ClassifierListeners {
  private readonly logger = new Logger(ClassifierListeners.name);

  constructor(
    private readonly classifierService: ClassifierService,
    private readonly prismaService: PrismaService
  ) {}

  @HandleEvent('asset.variant.ready')
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

    const classifiers = await this.classifierService.listClassifiers();
    const entities = classifiers.filter((classifier) =>
      variant.classifiersOnUpload.includes(classifier.name)
    );

    // Run classifiers in parallel (fire and forget - each classifier will publish its own completion event on success)
    Promise.all(entities.map((entity) => entity.run(variant.id))).catch(
      (error) => {
        // Log error but don't throw - we don't want to block the event handler
        this.logger.error(
          `Error running classifiers for variant ${variant.id}:`,
          error
        );
      }
    );
  }
}
