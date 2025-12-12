import { ClassifierRunStatus, ClassifierTemplate, Prisma } from '@/database';
import { AssetService, AssetVariantEntity } from '@/modules/asset';
import { selectClassifier } from '@/modules/classifier/classifier.selectors';
import { PrismaService } from '@/modules/common/services';
import { EventPublisher } from '@/modules/event';
import { Unexpected } from '@/shared/errors';
import { ConfigValues } from '@longpoint/config-schema';
import { toBase64DataUri } from '@longpoint/utils/string';
import { Logger } from '@nestjs/common';
import { ClassifierTemplateNotFound } from '../classifier.errors';
import { ClassifierEvents } from '../classifier.events';
import {
  ClassifierTemplateDto,
  ClassifierTemplateSummaryDto,
  UpdateClassifierTemplateDto,
} from '../dtos';
import { ClassifierService } from '../services/classifier.service';
import { ClassifierEntity } from './classifier.entity';

export interface ClassifierTemplateEntityArgs
  extends Pick<
    ClassifierTemplate,
    'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'modelInput'
  > {
  classifier: ClassifierEntity;
  prismaService: PrismaService;
  classifierService: ClassifierService;
  assetService: AssetService;
  eventPublisher: EventPublisher;
}

export class ClassifierTemplateEntity {
  private readonly prismaService: PrismaService;
  private readonly classifierService: ClassifierService;
  private readonly assetService: AssetService;
  private readonly eventPublisher: EventPublisher;
  private readonly logger = new Logger(ClassifierTemplateEntity.name);

  private _id: string;
  private _name: string;
  private _description: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _classifier: ClassifierEntity;
  private _modelInput: ConfigValues | null;

  constructor(args: ClassifierTemplateEntityArgs) {
    this._id = args.id;
    this._name = args.name;
    this._description = args.description;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this._classifier = args.classifier;
    this._modelInput = args.modelInput as ConfigValues;
    this.prismaService = args.prismaService;
    this.classifierService = args.classifierService;
    this.assetService = args.assetService;
    this.eventPublisher = args.eventPublisher;
  }

  /**
   * Runs the classifier on an asset variant.
   * @param assetVariantId - The ID of the asset variant to run the classifier on.
   * @returns The result of the classifier run.
   */
  async run(assetVariantId: string) {
    const asset = await this.assetService.getAssetByVariantIdOrThrow(
      assetVariantId
    );
    const variant = await this.assetService.getAssetVariantByIdOrThrow(
      assetVariantId
    );
    const assetId = asset.id;

    if (!variant.url) {
      this.logger.warn(
        `Asset variant "${assetVariantId}" has no URL - skipping classifier run`
      );
      return;
    }

    if (!this.classifier.isMimeTypeSupported(variant.mimeType)) {
      this.logger.warn(
        `Classifier "${this.classifier.fullyQualifiedId}" does not support mime type "${variant.mimeType}" - skipping classifier run`
      );
      return;
    }

    if (
      this.classifier.maxFileSize &&
      (variant.size ?? 0) > this.classifier.maxFileSize
    ) {
      this.logger.warn(
        `Asset variant "${assetVariantId}" is too large for classifier "${this.classifier.fullyQualifiedId}" - skipping classifier run`
      );
      return;
    }

    const classifierRun = await this.prismaService.classifierRun.create({
      data: {
        status: ClassifierRunStatus.PROCESSING,
        classifierTemplateId: this.id,
        assetVariantId,
        startedAt: new Date(),
      },
    });

    try {
      const source = await this.getAssetSource(variant);
      const result = await this.classifier.classify({
        source,
        classifierInput: this.modelInput as ConfigValues,
      });
      const updatedRun = await this.prismaService.classifierRun.update({
        where: {
          id: classifierRun.id,
        },
        data: {
          status: ClassifierRunStatus.SUCCESS,
          result,
          completedAt: new Date(),
        },
      });
      await this.eventPublisher.publish(
        ClassifierEvents.CLASSIFIER_RUN_COMPLETE,
        {
          assetId: assetId,
          assetVariantId,
          classifierId: this.id,
          classifierName: this.name,
          result: JSON.parse(JSON.stringify(result)),
        }
      );
      return updatedRun;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Classifier "${this.name}" failed: ${errorMessage}`);
      return await this.prismaService.classifierRun.update({
        where: {
          id: classifierRun.id,
        },
        data: {
          status: ClassifierRunStatus.FAILED,
          errorMessage,
          completedAt: new Date(),
        },
      });
    }
  }

  async update(data: UpdateClassifierTemplateDto) {
    const oldModelInput = this.modelInput as ConfigValues | undefined;
    const newClassifierId = data.classifierId;
    const newModelInput = data.modelInput ?? undefined;

    let modelInputToUpdate: ConfigValues | undefined;
    let classifier = this._classifier;

    if (newClassifierId && !newModelInput) {
      classifier = await this.classifierService.getClassifierByIdOrThrow(
        newClassifierId
      );
      modelInputToUpdate = await classifier.processInboundInput(oldModelInput);
    } else if (newModelInput && !newClassifierId) {
      modelInputToUpdate = await classifier.processInboundInput(newModelInput);
    } else if (newModelInput && newClassifierId) {
      classifier = await this.classifierService.getClassifierByIdOrThrow(
        newClassifierId
      );
      modelInputToUpdate = await classifier.processInboundInput(newModelInput);
    }

    const updatedClassifier =
      await this.prismaService.classifierTemplate.update({
        where: {
          id: this.id,
        },
        data: {
          name: data.name,
          description: data.description,
          classifierId: data.classifierId,
          modelInput:
            data.modelInput === null ? Prisma.JsonNull : modelInputToUpdate,
        },
        select: selectClassifier(),
      });

    this._name = updatedClassifier.name;
    this._description = updatedClassifier.description;
    this._modelInput = updatedClassifier.modelInput as ConfigValues;
    this._updatedAt = updatedClassifier.updatedAt;
    this._createdAt = updatedClassifier.createdAt;
    this._classifier = classifier;
  }

  async delete() {
    try {
      await this.prismaService.classifierTemplate.delete({
        where: {
          id: this.id,
        },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new ClassifierTemplateNotFound(this.id);
      }
      throw e;
    }
  }

  toDto(): ClassifierTemplateDto {
    return new ClassifierTemplateDto({
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      provider: this.classifier.toSummaryDto(),
      modelInputSchema: this.classifier.classifierInputSchema,
      modelInput: this.modelInput,
    });
  }

  toSummaryDto(): ClassifierTemplateSummaryDto {
    return new ClassifierTemplateSummaryDto({
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      provider: this.classifier.toSummaryDto(),
    });
  }

  private async getAssetSource(variant: AssetVariantEntity) {
    if (!variant.url) {
      throw new Unexpected('Variant URL is required');
    }

    const url = new URL(variant.url);

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const imageData = await fetch(url.href);
      const imageBuffer = await imageData.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      return {
        base64,
        mimeType: variant.mimeType,
        base64DataUri: toBase64DataUri(variant.mimeType, base64),
        url: variant.url,
      };
    }

    return {
      base64: undefined,
      mimeType: variant.mimeType,
      url: variant.url,
    };
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get modelInput(): ConfigValues | null {
    return this._modelInput;
  }

  get classifier(): ClassifierEntity {
    return this._classifier;
  }
}
