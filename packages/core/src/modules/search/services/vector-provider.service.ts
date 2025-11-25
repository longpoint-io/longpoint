import {
  ConfigSchemaService,
  PrismaService,
} from '@/modules/common/services';
import { PluginRegistryService } from '@/modules/plugin/services';
import { InvalidInput, InvalidProviderConfig } from '@/shared/errors';
import { ConfigValues } from '@longpoint/config-schema';
import { VectorProviderPlugin } from '@longpoint/devkit';
import { Injectable } from '@nestjs/common';
import { BaseVectorProviderEntity } from '../entities/base-vector-provider.entity';
import { VectorProviderEntity } from '../entities/vector-provider.entity';
import { SearchIndexNotFound, VectorProviderNotFound } from '../search.errors';

@Injectable()
export class VectorProviderService {
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
    const plugins = this.pluginRegistryService.listPlugins('vector');
    const providerConfigs =
      await this.prismaService.vectorProviderConfig.findMany({
        where: {
          providerId: {
            in: plugins.map((p) => p.derivedId),
          },
        },
        select: {
          providerId: true,
          config: true,
        },
      });

    return Promise.all(
      plugins.map(async (registryEnty) => {
        const providerConfig = providerConfigs.find(
          (pc) => pc.providerId === registryEnty.derivedId
        );

        const providerConfigValues = providerConfig?.config
          ? await this.configSchemaService
              .get(registryEnty.manifest.providerConfigSchema)
              .processOutboundValues(providerConfig.config as ConfigValues)
          : {};

        return new BaseVectorProviderEntity({
          id: registryEnty.derivedId,
          displayName: registryEnty.manifest.displayName,
          image: registryEnty.manifest.image,
          configSchemaService: this.configSchemaService,
          supportsEmbedding: registryEnty.manifest.supportsEmbedding ?? false,
          providerConfigSchema: registryEnty.manifest.providerConfigSchema,
          providerConfigValues,
          indexConfigSchema: registryEnty.manifest.indexConfigSchema,
        });
      })
    );
  }

  async getProviderById(id: string) {
    const registryEntry =
      this.pluginRegistryService.getPluginById<'vector'>(id);
    if (!registryEntry) {
      return null;
    }

    const cached = this.providerEntityCache.get(id);
    if (cached) {
      return cached;
    }

    const configFromDb =
      await this.prismaService.vectorProviderConfig.findUnique({
        where: {
          providerId: id,
        },
        select: {
          config: true,
        },
      });

    const configValuesFromDb = (configFromDb?.config ?? {}) as ConfigValues;

    try {
      const providerConfigValues = await this.configSchemaService
        .get(registryEntry.manifest.providerConfigSchema)
        .processOutboundValues(configValuesFromDb);

      const pluginInstance = new registryEntry.provider({
        providerConfigValues,
      }) as VectorProviderPlugin;

      const entity = new VectorProviderEntity({
        pluginRegistryEntry: registryEntry,
        plugin: pluginInstance,
        configSchemaService: this.configSchemaService,
      });

      this.providerEntityCache.set(id, entity);
      return entity;
    } catch (e) {
      if (e instanceof InvalidInput) {
        throw new InvalidProviderConfig('vector', id, e.getMessages());
      }
      throw e;
    }
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
      this.pluginRegistryService.getPluginById<'vector'>(providerId);
    if (!registryEntry) {
      throw new VectorProviderNotFound(providerId);
    }

    const schemaObj = registryEntry.manifest.providerConfigSchema;
    if (!schemaObj) {
      throw new InvalidInput('Provider does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(schemaObj)
      .processInboundValues(configValues);

    await this.prismaService.vectorProviderConfig.upsert({
      where: { providerId },
      update: { config: inboundConfig },
      create: { providerId, config: inboundConfig },
    });

    // Evict cached entity for this provider
    this.evictProviderCache(providerId);

    const providerConfigValues = await this.configSchemaService
      .get(registryEntry.manifest.providerConfigSchema)
      .processOutboundValues(inboundConfig);

    return new BaseVectorProviderEntity({
      id: providerId,
      displayName: registryEntry.manifest.displayName,
      image: registryEntry.manifest.image,
      supportsEmbedding: registryEntry.manifest.supportsEmbedding ?? false,
      providerConfigSchema: registryEntry.manifest.providerConfigSchema,
      providerConfigValues,
      configSchemaService: this.configSchemaService,
      indexConfigSchema: registryEntry.manifest.indexConfigSchema,
    });
  }

  async processIndexConfigForDb(
    providerId: string,
    configValues: ConfigValues
  ) {
    const registryEntry =
      this.pluginRegistryService.getPluginById<'vector'>(providerId);
    if (!registryEntry) {
      throw new VectorProviderNotFound(providerId);
    }
    return await this.configSchemaService
      .get(registryEntry.manifest.indexConfigSchema)
      .processInboundValues(configValues);
  }

  /**
   * Evict provider entities from cache.
   */
  private evictProviderCache(providerId: string): void {
    this.providerEntityCache.delete(providerId);
  }
}
