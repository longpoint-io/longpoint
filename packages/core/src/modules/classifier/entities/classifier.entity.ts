import { Classifier, ClassifierRunStatus, Prisma } from '@/database';
import { PrismaService } from '@/modules/common/services';
import { EventPublisher } from '@/modules/event';
import { MediaAssetDto, MediaContainerService } from '@/modules/media';
import { Unexpected } from '@/shared/errors';
import { selectClassifier } from '@/shared/selectors/classifier.selectors';
import { ConfigValues } from '@longpoint/config-schema';
import { toBase64DataUri } from '@longpoint/utils/string';
import { Logger } from '@nestjs/common';
import { ClassifierNotFound } from '../classifier.errors';
import { ClassifierEvents } from '../classifier.events';
import {
  ClassifierDto,
  ClassifierSummaryDto,
  UpdateClassifierDto,
} from '../dtos';
import { ClassificationProviderService } from '../services/classification-provider.service';
import { ClassificationProviderEntity } from './classification-provider.entity';

export interface ClassifierEntityArgs
  extends Pick<
    Classifier,
    'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'modelInput'
  > {
  classificationProvider: ClassificationProviderEntity;
  prismaService: PrismaService;
  classificationProviderService: ClassificationProviderService;
  mediaContainerService: MediaContainerService;
  eventPublisher: EventPublisher;
}

export class ClassifierEntity {
  private readonly prismaService: PrismaService;
  private readonly classificationProviderService: ClassificationProviderService;
  private readonly mediaContainerService: MediaContainerService;
  private readonly eventPublisher: EventPublisher;
  private readonly logger = new Logger(ClassifierEntity.name);

  private _id: string;
  private _name: string;
  private _description: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _classificationProvider: ClassificationProviderEntity;
  private _modelInput: ConfigValues | null;

  constructor(args: ClassifierEntityArgs) {
    this._id = args.id;
    this._name = args.name;
    this._description = args.description;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this._classificationProvider = args.classificationProvider;
    this._modelInput = args.modelInput as ConfigValues;
    this.prismaService = args.prismaService;
    this.classificationProviderService = args.classificationProviderService;
    this.mediaContainerService = args.mediaContainerService;
    this.eventPublisher = args.eventPublisher;
  }

  /**
   * Runs the classifier on a media asset.
   * @param mediaAssetId - The ID of the media asset to run the classifier on.
   * @returns The result of the classifier run.
   */
  async run(mediaAssetId: string) {
    const container =
      await this.mediaContainerService.getMediaContainerByAssetIdOrThrow(
        mediaAssetId
      );
    const containerId = container.id;
    const serialized = await container.toDto();
    const asset = serialized.variants.primary;

    if (!asset.url) {
      this.logger.warn(
        `Media asset "${mediaAssetId}" has no URL - skipping classifier run`
      );
      return;
    }

    if (!this.classificationProvider.isMimeTypeSupported(asset.mimeType)) {
      this.logger.warn(
        `Classification provider "${this.classificationProvider.fullyQualifiedId}" does not support mime type "${asset.mimeType}" - skipping classifier run`
      );
      return;
    }

    if ((asset.size ?? 0) > this.classificationProvider.maxFileSize) {
      this.logger.warn(
        `Media asset "${mediaAssetId}" is too large for classification provider "${this.classificationProvider.fullyQualifiedId}" - skipping classifier run`
      );
      return;
    }

    const classifierRun = await this.prismaService.classifierRun.create({
      data: {
        status: ClassifierRunStatus.PROCESSING,
        classifierId: this.id,
        mediaAssetId,
        startedAt: new Date(),
      },
    });

    try {
      const source = await this.getAssetSource(asset);
      const result = await this.classificationProvider.classify({
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
          mediaContainerId: containerId,
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

  async update(data: UpdateClassifierDto) {
    const oldModelInput = this.modelInput as ConfigValues | undefined;
    const newModelId = data.modelId;
    const newModelInput = data.modelInput ?? undefined;

    let modelInputToUpdate: ConfigValues | undefined;
    let classificationProvider = this._classificationProvider;

    if (newModelId && !newModelInput) {
      classificationProvider =
        await this.classificationProviderService.getClassificationProviderByIdOrThrow(
          newModelId
        );
      modelInputToUpdate =
        await classificationProvider.processInboundClassifierInput(
          oldModelInput
        );
    } else if (newModelInput && !newModelId) {
      modelInputToUpdate =
        await classificationProvider.processInboundClassifierInput(
          newModelInput
        );
    } else if (newModelInput && newModelId) {
      classificationProvider =
        await this.classificationProviderService.getClassificationProviderByIdOrThrow(
          newModelId
        );
      modelInputToUpdate =
        await classificationProvider.processInboundClassifierInput(
          newModelInput
        );
    }

    const updatedClassifier = await this.prismaService.classifier.update({
      where: {
        id: this.id,
      },
      data: {
        name: data.name,
        description: data.description,
        modelId: data.modelId,
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
    this._classificationProvider = classificationProvider;
  }

  async delete() {
    try {
      await this.prismaService.classifier.delete({
        where: {
          id: this.id,
        },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new ClassifierNotFound(this.id);
      }
      throw e;
    }
  }

  toDto(): ClassifierDto {
    return new ClassifierDto({
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      classificationProvider: this.classificationProvider.toSummaryDto(),
      modelInputSchema: this.classificationProvider.classifierInputSchema,
      modelInput: this.modelInput,
    });
  }

  toSummaryDto(): ClassifierSummaryDto {
    return new ClassifierSummaryDto({
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      classificationProvider: this.classificationProvider.toSummaryDto(),
    });
  }

  private async getAssetSource(asset: MediaAssetDto) {
    if (!asset.url) {
      throw new Unexpected('Asset URL is required');
    }

    const url = new URL(asset.url);

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const imageData = await fetch(url.href);
      const imageBuffer = await imageData.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      return {
        base64,
        mimeType: asset.mimeType,
        base64DataUri: toBase64DataUri(asset.mimeType, base64),
        url: undefined,
      };
    }

    return {
      base64: undefined,
      mimeType: asset.mimeType,
      url: asset.url,
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

  get classificationProvider(): ClassificationProviderEntity {
    return this._classificationProvider;
  }
}
