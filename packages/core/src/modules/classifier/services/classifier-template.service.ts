import { Prisma } from '@/database';
import { TemplateSource } from '@/shared/types/template.types';
import { ConfigValues } from '@longpoint/config-schema';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AssetService } from '../../asset';
import { PrismaService } from '../../common/services';
import { EventPublisher } from '../../event';
import { PluginRegistryService } from '../../plugin/services';
import { ClassifierTemplateNotFound } from '../classifier.errors';
import { selectClassifierTemplate } from '../classifier.selectors';
import { ListClassifierTemplatesQueryDto } from '../dtos';
import { CreateClassifierTemplateDto } from '../dtos/create-classifier-template.dto';
import {
  ClassifierEntity,
  ClassifierTemplateEntity,
  ClassifierTemplateEntityArgs,
} from '../entities';
import { ClassifierService } from './classifier.service';

@Injectable()
export class ClassifierTemplateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classifierService: ClassifierService,
    @Inject(forwardRef(() => AssetService))
    private readonly assetService: AssetService,
    private readonly eventPublisher: EventPublisher,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  async createClassifierTemplate(data: CreateClassifierTemplateDto) {
    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      data.classifierId
    );
    const processedModelInput = await classifier.processInboundInput(
      data.input
    );

    const classifierTemplate =
      await this.prismaService.classifierTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          classifierId: data.classifierId,
          input: processedModelInput,
        },
        select: selectClassifierTemplate(),
      });

    return this.getClassifierTemplateEntity(classifierTemplate, classifier);
  }

  async getClassifierTemplateById(id: string) {
    // Check if this is a plugin-defined template (format: pluginId/templateKey)
    if (id.includes('/')) {
      const pluginTemplate = await this.getPluginTemplateById(id);
      if (pluginTemplate) {
        return pluginTemplate;
      }
    }

    // Fall back to database lookup for custom templates
    const classifierTemplate =
      await this.prismaService.classifierTemplate.findUnique({
        where: {
          id,
        },
        select: selectClassifierTemplate(),
      });

    if (!classifierTemplate) {
      return null;
    }

    return this.getClassifierTemplateEntity(
      classifierTemplate,
      classifierTemplate.classifierId
    );
  }

  async getClassifierTemplateByIdOrThrow(id: string) {
    const classifierTemplate = await this.getClassifierTemplateById(id);
    if (!classifierTemplate) {
      throw new ClassifierTemplateNotFound(id);
    }
    return classifierTemplate;
  }

  async listClassifierTemplates(
    query = new ListClassifierTemplatesQueryDto()
  ): Promise<ClassifierTemplateEntity[]> {
    const pluginTemplates = await this.getAllPluginTemplates();

    const dbTemplates = await this.prismaService.classifierTemplate.findMany({
      select: selectClassifierTemplate(),
    });

    const customTemplates = await Promise.all(
      dbTemplates.map((template) =>
        this.getClassifierTemplateEntity(template, template.classifierId)
      )
    );

    const allTemplates = [...pluginTemplates, ...customTemplates].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    const pageSize = query.pageSize ?? 1000;
    let startIndex = 0;

    if (query.cursor) {
      const cursorIndex = allTemplates.findIndex(
        (template) => template.id === query.cursor
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    return allTemplates.slice(startIndex, startIndex + pageSize);
  }

  private async getAllPluginTemplates(): Promise<ClassifierTemplateEntity[]> {
    const pluginTemplates: ClassifierTemplateEntity[] = [];
    const registryEntries = this.pluginRegistryService.listClassifiers();

    for (const registryEntry of registryEntries) {
      const templates = registryEntry.contribution.templates;
      if (!templates) {
        continue;
      }

      const classifier = await this.classifierService.getClassifierByIdOrThrow(
        registryEntry.fullyQualifiedId
      );

      for (const [templateKey, template] of Object.entries(templates)) {
        const templateName = `${registryEntry.pluginId}/${templateKey}`;
        const templateEntity = await this.getClassifierTemplateEntity(
          {
            id: templateName,
            name: templateName,
            source: TemplateSource.PLUGIN,
            description: template.description ?? null,
            createdAt: null,
            updatedAt: null,
            input: template.input as ConfigValues | null,
          },
          classifier
        );
        pluginTemplates.push(templateEntity);
      }
    }

    return pluginTemplates;
  }

  private async getPluginTemplateById(
    id: string
  ): Promise<ClassifierTemplateEntity | null> {
    const registryEntries = this.pluginRegistryService.listClassifiers();

    for (const registryEntry of registryEntries) {
      const templates = registryEntry.contribution.templates;
      if (!templates) {
        continue;
      }

      for (const [templateKey, template] of Object.entries(templates)) {
        const templateName = `${registryEntry.pluginId}/${templateKey}`;
        if (templateName === id) {
          const classifier =
            await this.classifierService.getClassifierByIdOrThrow(
              registryEntry.fullyQualifiedId
            );

          return this.getClassifierTemplateEntity(
            {
              id: templateName,
              name: templateName,
              source: TemplateSource.PLUGIN,
              description: template.description ?? null,
              createdAt: null,
              updatedAt: null,
              input: template.input as ConfigValues | null,
            },
            classifier
          );
        }
      }
    }

    return null;
  }

  private async getClassifierTemplateEntity(
    data: Pick<
      ClassifierTemplateEntityArgs,
      'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
    > &
      Partial<Pick<ClassifierTemplateEntityArgs, 'source'>> & {
        input: Prisma.JsonValue;
      },
    classifier: ClassifierEntity | string
  ) {
    if (typeof classifier === 'string') {
      classifier = await this.classifierService.getClassifierByIdOrThrow(
        classifier
      );
    }
    return new ClassifierTemplateEntity({
      id: data.id,
      name: data.name,
      description: data.description,
      source: data.source ?? TemplateSource.CUSTOM,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      classifier,
      input: data.input as ConfigValues,
      assetService: this.assetService,
      classifierService: this.classifierService,
      eventPublisher: this.eventPublisher,
      prismaService: this.prismaService,
    });
  }
}
