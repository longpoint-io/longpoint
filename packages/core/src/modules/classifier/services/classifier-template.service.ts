import { ConfigValues } from '@longpoint/config-schema';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AssetService } from '../../asset';
import { PrismaService } from '../../common/services';
import { EventPublisher } from '../../event';
import { ClassifierTemplateNotFound } from '../classifier.errors';
import { selectClassifier } from '../classifier.selectors';
import { CreateClassifierTemplateDto } from '../dtos/create-classifier-template.dto';
import { ClassifierTemplateEntity } from '../entities';
import { ClassifierService } from './classifier.service';

@Injectable()
export class ClassifierTemplateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classifierService: ClassifierService,
    @Inject(forwardRef(() => AssetService))
    private readonly assetService: AssetService,
    private readonly eventPublisher: EventPublisher
  ) {}

  async createClassifierTemplate(data: CreateClassifierTemplateDto) {
    const modelInput = data.modelInput ?? undefined;
    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      data.classifierId
    );
    const processedModelInput = await classifier.processInboundInput(
      modelInput
    );

    const classifierTemplate =
      await this.prismaService.classifierTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          classifierId: data.classifierId,
          modelInput: processedModelInput,
        },
        select: selectClassifier(),
      });

    const classifierTemplateEntity = new ClassifierTemplateEntity({
      id: classifierTemplate.id,
      name: classifierTemplate.name,
      description: classifierTemplate.description,
      createdAt: classifierTemplate.createdAt,
      updatedAt: classifierTemplate.updatedAt,
      classifier,
      modelInput: processedModelInput,
      prismaService: this.prismaService,
      classifierService: this.classifierService,
      assetService: this.assetService,
      eventPublisher: this.eventPublisher,
    });

    return classifierTemplateEntity;
  }

  async getClassifierTemplateById(id: string) {
    const classifierTemplate =
      await this.prismaService.classifierTemplate.findUnique({
        where: {
          id,
        },
        select: selectClassifier(),
      });

    if (!classifierTemplate) {
      return null;
    }

    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      classifierTemplate.classifierId
    );

    return new ClassifierTemplateEntity({
      ...classifierTemplate,
      classifier,
      prismaService: this.prismaService,
      classifierService: this.classifierService,
      modelInput: classifierTemplate.modelInput as ConfigValues,
      assetService: this.assetService,
      eventPublisher: this.eventPublisher,
    });
  }

  async getClassifierTemplateByIdOrThrow(id: string) {
    const classifierTemplate = await this.getClassifierTemplateById(id);
    if (!classifierTemplate) {
      throw new ClassifierTemplateNotFound(id);
    }
    return classifierTemplate;
  }

  async listClassifierTemplates(): Promise<ClassifierTemplateEntity[]> {
    const classifierTemplates =
      await this.prismaService.classifierTemplate.findMany({
        select: selectClassifier(),
      });

    return Promise.all(
      classifierTemplates.map(async (classifierTemplate) => {
        const classifier =
          await this.classifierService.getClassifierByIdOrThrow(
            classifierTemplate.classifierId
          );
        return new ClassifierTemplateEntity({
          ...classifierTemplate,
          classifier,
          prismaService: this.prismaService,
          classifierService: this.classifierService,
          assetService: this.assetService,
          eventPublisher: this.eventPublisher,
        });
      })
    );
  }
}
