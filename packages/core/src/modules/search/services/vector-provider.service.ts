import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import {
  PluginRegistryService,
  VectorProviderRegistryEntry,
} from '@/modules/plugin/services';
import { InvalidInput, InvalidProviderConfig } from '@/shared/errors';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { BaseVectorProviderEntity } from '../entities/base-vector-provider.entity';
import { VectorProviderEntity } from '../entities/vector-provider.entity';
import { SearchIndexNotFound, VectorProviderNotFound } from '../search.errors';

@Injectable()
export class VectorProviderService {
  private readonly logger = new Logger(VectorProviderService.name);
  private readonly providerEntityCache = new Map<
    string,
    VectorProviderEntity
  >();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  /**
   * List all installed vector providers.
   * @returns A list of base vector provider entities.
   */
  async listProviders() {
    const registryEntries = this.pluginRegistryService.listVectorProviders();

    return Promise.all(
      registryEntries.map(async (registryEntry) => {
        return await this.getBaseProviderEntity(registryEntry);
      })
    );
  }

  async getProviderById(id: string) {
    const registryEntry = this.pluginRegistryService.getVectorProviderById(id);
    if (!registryEntry) {
      return null;
    }

    return this.getProviderEntity(registryEntry);
  }

  async getProviderByIdOrThrow(id: string) {
    const provider = await this.getProviderById(id);
    if (!provider) {
      throw new VectorProviderNotFound(id);
    }
    return provider;
  }

  async getProviderBySearchIndexId(indexId: string) {
    const index = await this.prismaService.searchIndex.findUnique({
      where: { id: indexId },
      select: { vectorProviderId: true },
    });
    if (!index) {
      throw new SearchIndexNotFound(indexId);
    }
    return await this.getProviderById(index.vectorProviderId);
  }

  async getProviderBySearchIndexIdOrThrow(indexId: string) {
    const provider = await this.getProviderBySearchIndexId(indexId);
    if (!provider) {
      throw new VectorProviderNotFound(indexId);
    }
    return provider;
  }

  /**
   * Update the configuration values for a provider.
   * @param providerId - The ID of the provider to update.
   * @param configValues - The configuration values to update.
   * @returns A base vector provider entity with the updated configuration.
   */
  async updateProviderConfig(providerId: string, configValues: ConfigValues) {
    const registryEntry =
      this.pluginRegistryService.getVectorProviderById(providerId);
    if (!registryEntry) {
      throw new VectorProviderNotFound(providerId);
    }

    const settingsSchema = registryEntry.pluginConfig.contributes?.settings;
    if (!settingsSchema) {
      throw new InvalidInput('Provider does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(settingsSchema)
      .processInboundValues(configValues);

    await this.prismaService.pluginSettings.upsert({
      where: { pluginId: registryEntry.pluginId },
      update: { config: inboundConfig },
      create: { pluginId: registryEntry.pluginId, config: inboundConfig },
    });

    // Evict cached entity for this provider
    this.evictProviderCache(registryEntry.fullyQualifiedId);

    const pluginSettings = await this.configSchemaService
      .get(settingsSchema)
      .processOutboundValues(inboundConfig);

    return new BaseVectorProviderEntity({
      id: registryEntry.fullyQualifiedId,
      displayName:
        registryEntry.contribution.displayName ??
        registryEntry.pluginConfig.displayName ??
        registryEntry.vectorId,
      image: registryEntry.pluginConfig.icon,
      supportsEmbedding: registryEntry.contribution.supportsEmbedding ?? false,
      providerConfigSchema: settingsSchema,
      providerConfigValues: pluginSettings,
      configSchemaService: this.configSchemaService,
      indexConfigSchema: registryEntry.contribution.indexConfigSchema,
    });
  }

  async processIndexConfigForDb(
    providerId: string,
    configValues: ConfigValues
  ) {
    const registryEntry =
      this.pluginRegistryService.getVectorProviderById(providerId);
    if (!registryEntry) {
      throw new VectorProviderNotFound(providerId);
    }

    const indexConfigSchema = registryEntry.contribution.indexConfigSchema;
    if (!indexConfigSchema) {
      throw new InvalidInput('Provider does not support index configuration');
    }

    return await this.configSchemaService
      .get(indexConfigSchema)
      .processInboundValues(configValues);
  }

  /**
   * Get or create a provider entity.
   */
  private async getProviderEntity(
    registryEntry: VectorProviderRegistryEntry
  ): Promise<VectorProviderEntity | null> {
    const cached = this.providerEntityCache.get(registryEntry.fullyQualifiedId);
    if (cached) {
      return cached;
    }

    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    try {
      const pluginInstance = new registryEntry.contribution.provider({
        pluginSettings: pluginSettings ?? {},
      });

      const entity = new VectorProviderEntity({
        registryEntry,
        plugin: pluginInstance,
        configSchemaService: this.configSchemaService,
      });

      this.providerEntityCache.set(registryEntry.fullyQualifiedId, entity);
      return entity;
    } catch (e) {
      if (e instanceof InvalidInput) {
        throw new InvalidProviderConfig(
          'vector',
          registryEntry.fullyQualifiedId,
          e.getMessages()
        );
      }
      throw e;
    }
  }

  /**
   * Get base provider entity.
   */
  private async getBaseProviderEntity(
    registryEntry: VectorProviderRegistryEntry
  ): Promise<BaseVectorProviderEntity> {
    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    return new BaseVectorProviderEntity({
      id: registryEntry.fullyQualifiedId,
      displayName:
        registryEntry.contribution.displayName ??
        registryEntry.pluginConfig.displayName ??
        registryEntry.vectorId,
      image: registryEntry.pluginConfig.icon,
      configSchemaService: this.configSchemaService,
      supportsEmbedding: registryEntry.contribution.supportsEmbedding ?? false,
      providerConfigSchema: registryEntry.pluginConfig.contributes?.settings,
      providerConfigValues: pluginSettings ?? {},
      indexConfigSchema: registryEntry.contribution.indexConfigSchema,
    });
  }

  /**
   * Get plugin settings from database.
   */
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

  /**
   * Evict provider entities from cache.
   */
  private evictProviderCache(providerId: string): void {
    this.providerEntityCache.delete(providerId);
  }
}
