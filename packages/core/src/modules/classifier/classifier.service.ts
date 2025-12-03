import { ConfigValues } from '@longpoint/config-schema';
import { Injectable } from '@nestjs/common';
import { selectClassifier } from '../../shared/selectors/classifier.selectors';
import { PrismaService } from '../common/services';
import { EventPublisher } from '../event';
import { AssetService } from '../media';
import { ClassifierNotFound } from './classifier.errors';
import { CreateClassifierDto } from './dtos/create-classifier.dto';
import { ClassifierEntity } from './entities';
import { ClassificationProviderService } from './services/classification-provider.service';

@Injectable()
export class ClassifierService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classificationProviderService: ClassificationProviderService,
    private readonly assetService: AssetService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async createClassifier(data: CreateClassifierDto) {
    const modelInput = data.modelInput ?? undefined;
    const classificationProvider =
      await this.classificationProviderService.getClassificationProviderByIdOrThrow(
        data.modelId
      );
    const processedModelInput =
      await classificationProvider.processInboundClassifierInput(modelInput);

    const classifier = await this.prismaService.classifier.create({
      data: {
        name: data.name,
        description: data.description,
        modelId: data.modelId,
        modelInput: processedModelInput,
      },
      select: selectClassifier(),
    });

    const classifierEntity = new ClassifierEntity({
      id: classifier.id,
      name: classifier.name,
      description: classifier.description,
      createdAt: classifier.createdAt,
      updatedAt: classifier.updatedAt,
      classificationProvider,
      modelInput: processedModelInput,
      prismaService: this.prismaService,
      classificationProviderService: this.classificationProviderService,
      assetService: this.assetService,
      eventPublisher: this.eventPublisher,
    });

    return classifierEntity;
  }

  async getClassifierById(id: string) {
    const classifier = await this.prismaService.classifier.findUnique({
      where: {
        id,
      },
      select: selectClassifier(),
    });

    if (!classifier) {
      return null;
    }

    const classificationProvider =
      await this.classificationProviderService.getClassificationProviderByIdOrThrow(
        classifier.modelId
      );

    return new ClassifierEntity({
      ...classifier,
      classificationProvider,
      prismaService: this.prismaService,
      classificationProviderService: this.classificationProviderService,
      modelInput: classifier.modelInput as ConfigValues,
      assetService: this.assetService,
      eventPublisher: this.eventPublisher,
    });
  }

  async getClassifierByIdOrThrow(id: string) {
    const classifier = await this.getClassifierById(id);
    if (!classifier) {
      throw new ClassifierNotFound(id);
    }
    return classifier;
  }

  async listClassifiers(): Promise<ClassifierEntity[]> {
    const classifiers = await this.prismaService.classifier.findMany({
      select: selectClassifier(),
    });

    return Promise.all(
      classifiers.map(async (classifier) => {
        const classificationProvider =
          await this.classificationProviderService.getClassificationProviderByIdOrThrow(
            classifier.modelId
          );
        return new ClassifierEntity({
          ...classifier,
          classificationProvider,
          prismaService: this.prismaService,
          classificationProviderService: this.classificationProviderService,
          assetService: this.assetService,
          eventPublisher: this.eventPublisher,
        });
      })
    );
  }
}
