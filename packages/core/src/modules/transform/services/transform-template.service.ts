import { AssetService } from '@/modules/asset';
import { PluginRegistryService } from '@/modules/plugin';
import { PaginationQueryDto } from '@/shared/dtos';
import { TemplateSource } from '@/shared/types/template.types';
import { ConfigValues } from '@longpoint/config-schema';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services';
import { CreateTransformTemplateDto } from '../dtos';
import { TransformTemplateEntity } from '../entities/transform-template.entity';
import { TransformerEntity } from '../entities/transformer.entity';
import { TransformTemplateNotFound } from '../transform.errors';
import {
  SelectedTransformTemplate,
  selectTransformTemplate,
} from '../transform.selectors';
import { TransformerService } from './transformer.service';

@Injectable()
export class TransformTemplateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transformerService: TransformerService,
    private readonly assetService: AssetService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  async createTransformTemplate(data: CreateTransformTemplateDto) {
    const transformer = await this.transformerService.getTransformerByIdOrThrow(
      data.transformerId
    );
    const transformTemplate = await this.prismaService.transformTemplate.create(
      {
        data: {
          name: data.name,
          description: data.description,
          transformerId: data.transformerId,
          input: data.input,
        },
        select: selectTransformTemplate(),
      }
    );

    return await this.getTransformTemplateEntity(
      transformTemplate,
      transformer
    );
  }

  async getTransformTemplateById(id: string) {
    // Check if it's a plugin template (format: pluginId/templateKey)
    const parts = id.split('/');
    if (parts.length === 2) {
      const [pluginId, templateKey] = parts;
      const registryEntries = this.pluginRegistryService.listTransformers();

      for (const registryEntry of registryEntries) {
        if (registryEntry.pluginId === pluginId) {
          const templates = registryEntry.contribution.templates;
          if (templates && templateKey in templates) {
            const template = templates[templateKey];
            const transformer =
              await this.transformerService.getTransformerByIdOrThrow(
                registryEntry.fullyQualifiedId
              );
            return await this.getTransformTemplateEntity(
              {
                id,
                name: id,
                displayName: template.displayName,
                description: template.description ?? null,
                createdAt: null,
                updatedAt: null,
                input: template.input as ConfigValues | null,
                transformerId: registryEntry.fullyQualifiedId,
              },
              transformer,
              TemplateSource.PLUGIN
            );
          }
        }
      }
    }

    // Fall back to DB lookup
    const transformTemplate =
      await this.prismaService.transformTemplate.findUnique({
        where: { id },
        select: selectTransformTemplate(),
      });

    if (!transformTemplate) {
      return null;
    }

    const transformer = await this.transformerService.getTransformerByIdOrThrow(
      transformTemplate.transformerId
    );

    return await this.getTransformTemplateEntity(
      transformTemplate,
      transformer
    );
  }

  async getTransformTemplateByIdOrThrow(id: string) {
    const transformTemplate = await this.getTransformTemplateById(id);
    if (!transformTemplate) {
      throw new TransformTemplateNotFound(id);
    }
    return transformTemplate;
  }

  async listTransformTemplates(query: PaginationQueryDto) {
    const pluginTemplates: TransformTemplateEntity[] = [];
    const registryEntries = this.pluginRegistryService.listTransformers();

    for (const registryEntry of registryEntries) {
      const templates = registryEntry.contribution.templates;
      if (!templates) {
        continue;
      }

      const transformer =
        await this.transformerService.getTransformerByIdOrThrow(
          registryEntry.fullyQualifiedId
        );

      for (const [templateKey, template] of Object.entries(templates)) {
        const templateName = `${registryEntry.pluginId}/${templateKey}`;
        const templateEntity = await this.getTransformTemplateEntity(
          {
            id: templateName,
            name: templateName,
            displayName: template.displayName,
            description: template.description ?? null,
            createdAt: null,
            updatedAt: null,
            input: template.input as ConfigValues | null,
            transformerId: registryEntry.fullyQualifiedId,
          },
          transformer,
          TemplateSource.PLUGIN
        );
        pluginTemplates.push(templateEntity);
      }
    }

    const dbTemplates = await this.prismaService.transformTemplate.findMany({
      select: selectTransformTemplate(),
    });

    const customTemplates = await Promise.all(
      dbTemplates.map((template) =>
        this.getTransformTemplateEntity(template, template.transformerId)
      )
    );

    const allTemplates = [...pluginTemplates, ...customTemplates].sort((a, b) =>
      a.name.localeCompare(b.name)
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

  private async getTransformTemplateEntity(
    data: Pick<
      SelectedTransformTemplate,
      'id' | 'name' | 'displayName' | 'description' | 'input' | 'transformerId'
    > & {
      createdAt: Date | null;
      updatedAt: Date | null;
    },
    transformer: TransformerEntity | string,
    source?: TemplateSource
  ): Promise<TransformTemplateEntity> {
    if (typeof transformer === 'string') {
      const transformerEntity =
        await this.transformerService.getTransformerByIdOrThrow(transformer);
      return new TransformTemplateEntity({
        id: data.id,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        input: data.input,
        transformerId: data.transformerId,
        transformer: transformerEntity,
        prismaService: this.prismaService,
        assetService: this.assetService,
        source: source ?? TemplateSource.CUSTOM,
      });
    }

    return new TransformTemplateEntity({
      id: data.id,
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      input: data.input,
      transformerId: data.transformerId,
      transformer,
      prismaService: this.prismaService,
      assetService: this.assetService,
      source: source ?? TemplateSource.CUSTOM,
    });
  }
}
