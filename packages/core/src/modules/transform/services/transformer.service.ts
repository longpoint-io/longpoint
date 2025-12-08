import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import { PluginRegistryService } from '@/modules/plugin';
import { PaginationQueryDto } from '@/shared/dtos';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { TransformerEntity } from '../entities/transformer.entity';
import { TransformerNotFound } from '../transform.errors';

@Injectable()
export class TransformerService {
  private readonly transformerEntityCache = new Map<
    string,
    TransformerEntity
  >();
  private readonly logger = new Logger(TransformerService.name);

  constructor(
    private readonly pluginRegistryService: PluginRegistryService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly prismaService: PrismaService
  ) {}

  async listTransformers(query: PaginationQueryDto) {
    const transformers = this.pluginRegistryService.listTransformers();
    const entities: TransformerEntity[] = [];
    let total = 0;
    for (const transformer of transformers) {
      const entity = await this.getTransformerById(
        transformer.fullyQualifiedId
      );
      if (entity) {
        entities.push(entity);
        total++;
      }
      if (total >= query.pageSize) {
        break;
      }
    }
    return entities;
  }

  async getTransformerById(id: string) {
    const cached = this.transformerEntityCache.get(id);
    if (cached) {
      return cached;
    }

    const registryEntry = this.pluginRegistryService.getTransformerById(id);
    if (!registryEntry) {
      return null;
    }

    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    const transformerInstance = new registryEntry.contribution.transformer({
      pluginSettings: pluginSettings ?? {},
    });

    const entity = new TransformerEntity({
      pluginSettings,
      registryEntry,
      transformerInstance,
      configSchemaService: this.configSchemaService,
    });

    this.transformerEntityCache.set(id, entity);
    return entity;
  }

  async getTransformerByIdOrThrow(id: string) {
    const transformer = await this.getTransformerById(id);
    if (!transformer) {
      throw new TransformerNotFound(id);
    }
    return transformer;
  }

  private async getPluginSettingsFromDb(
    pluginId: string,
    schemaObj?: ConfigSchemaDefinition
  ): Promise<ConfigValues> {
    const pluginSettings = await this.prismaService.pluginSettings.findUnique({
      where: {
        pluginId,
      },
    });

    if (!pluginSettings) {
      return {};
    }

    try {
      return await this.configSchemaService
        .get(schemaObj)
        .processOutboundValues(pluginSettings?.config as ConfigValues);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Failed to decrypt data')
      ) {
        this.logger.warn(
          `Failed to decrypt config for plugin "${pluginId}", returning as is!`
        );
        return pluginSettings?.config as ConfigValues;
      }
      throw error;
    }
  }
}
