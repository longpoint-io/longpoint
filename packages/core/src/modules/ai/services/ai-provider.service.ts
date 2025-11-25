import { ConfigSchemaService } from '@/modules/common/services';
import {
  PluginRegistryEntry,
  PluginRegistryService,
} from '@/modules/plugin/services';
import { InvalidInput } from '@/shared/errors';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { AiModelManifest, AiProviderPlugin } from '@longpoint/devkit';
import { Injectable, Logger } from '@nestjs/common';
import { AiModelEntity } from '../../common/entities';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { AiProviderNotFound, ModelNotFound } from '../ai.errors';
import { AiProviderEntity } from '../entities/ai-provider.entity';

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private readonly providerEntityCache = new Map<string, AiProviderEntity>();
  private readonly modelEntityCache = new Map<string, AiModelEntity>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  /**
   * List all installed models.
   * @returns A list of ai model entities.
   */
  async listModels(): Promise<AiModelEntity[]> {
    const plugins = this.pluginRegistryService.listPlugins('ai');
    const models: AiModelEntity[] = [];

    for (const registryEntry of plugins) {
      const providerId = registryEntry.derivedId;
      const providerEntity = await this.getProviderEntity(providerId);
      if (!providerEntity) {
        continue;
      }

      for (const modelManifest of Object.values(
        registryEntry.manifest.models ?? {}
      ) as AiModelManifest[]) {
        const fullyQualifiedId = `${providerId}/${modelManifest.id}`;
        const model = await this.getModelEntity(fullyQualifiedId, {
          manifest: modelManifest,
          providerId,
          registryEntry,
        });
        if (model) {
          models.push(model);
        }
      }
    }

    return models;
  }

  /**
   * List all installed providers.
   * @returns A list of ai provider entities.
   */
  async listProviders(): Promise<AiProviderEntity[]> {
    const plugins = this.pluginRegistryService.listPlugins('ai');
    const providers: AiProviderEntity[] = [];

    for (const registryEntry of plugins) {
      const providerId = registryEntry.derivedId;
      const provider = await this.getProviderEntity(providerId);
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get a model by its fully qualified ID.
   * @param fullyQualifiedId - The fully qualified ID of the model to get.
   * @returns The ai model entity
   */
  async getModel(fullyQualifiedId: string): Promise<AiModelEntity | null> {
    const cached = this.modelEntityCache.get(fullyQualifiedId);
    if (cached) {
      return cached;
    }

    const [providerId, modelId] = fullyQualifiedId.split('/');

    const registryEntry =
      this.pluginRegistryService.getPluginById<'ai'>(providerId);
    if (!registryEntry) {
      return null;
    }

    const modelManifest = (registryEntry.manifest.models ?? {})[modelId] as
      | AiModelManifest
      | undefined;
    if (!modelManifest) {
      return null;
    }

    return this.getModelEntity(fullyQualifiedId, {
      manifest: modelManifest,
      providerId,
      registryEntry,
    });
  }

  /**
   * Get a model by its fully qualified ID and throw an error if it is not found.
   * @param fullyQualifiedId - The fully qualified ID of the model to get.
   * @returns The ai model entity.
   * @throws {ModelNotFound} If the model is not found.
   */
  async getModelOrThrow(fullyQualifiedId: string): Promise<AiModelEntity> {
    const model = await this.getModel(fullyQualifiedId);
    if (!model) {
      throw new ModelNotFound(fullyQualifiedId);
    }
    return model;
  }

  /**
   * Get a provider by its ID.
   * @param providerId - The ID of the provider to get.
   * @returns The ai provider entity, or `null` if the provider is not found.
   */
  async getProvider(providerId: string): Promise<AiProviderEntity | null> {
    return this.getProviderEntity(providerId);
  }

  /**
   * Get a provider by its ID and throw an error if it is not found.
   * @param providerId - The ID of the provider to get.
   * @returns The ai provider entity.
   * @throws {AiProviderNotFound} If the provider is not found.
   */
  async getProviderOrThrow(providerId: string): Promise<AiProviderEntity> {
    const provider = await this.getProvider(providerId);
    if (!provider) {
      throw new AiProviderNotFound(providerId);
    }
    return provider;
  }

  /**
   * Update the configuration values for a provider.
   * @param providerId - The ID of the provider to update.
   * @param configValues
   * @returns
   */
  async updateProviderConfig(providerId: string, configValues: ConfigValues) {
    const registryEntry =
      this.pluginRegistryService.getPluginById<'ai'>(providerId);
    if (!registryEntry) {
      throw new AiProviderNotFound(providerId);
    }

    const schemaObj = registryEntry.manifest.configSchema;
    if (!schemaObj) {
      throw new InvalidInput('Provider does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(schemaObj)
      .processInboundValues(configValues);

    await this.prismaService.aiProviderConfig.upsert({
      where: { providerId },
      update: { config: inboundConfig },
      create: { providerId, config: inboundConfig },
    });

    // Evict provider and related model entities from cache
    this.evictProviderCache(providerId);

    // Return fresh entity with updated config
    return this.getProviderOrThrow(providerId);
  }

  /**
   * Get or create a provider entity, loading config lazily.
   */
  private async getProviderEntity(
    providerId: string
  ): Promise<AiProviderEntity | null> {
    const cached = this.providerEntityCache.get(providerId);
    if (cached) {
      return cached;
    }

    const registryEntry =
      this.pluginRegistryService.getPluginById<'ai'>(providerId);
    if (!registryEntry) {
      return null;
    }

    const config = await this.getProviderConfigFromDb(
      providerId,
      registryEntry.manifest.configSchema
    );

    const pluginInstance = new registryEntry.provider({
      manifest: registryEntry.manifest,
      configValues: config ?? {},
    }) as AiProviderPlugin;

    const entity = new AiProviderEntity({
      pluginInstance,
      pluginRegistryEntry: registryEntry,
      configSchemaService: this.configSchemaService,
    });

    this.providerEntityCache.set(providerId, entity);
    return entity;
  }

  /**
   * Get or create a model entity.
   */
  private async getModelEntity(
    fullyQualifiedId: string,
    options: {
      manifest: AiModelManifest;
      providerId: string;
      registryEntry: PluginRegistryEntry<'ai'>;
    }
  ): Promise<AiModelEntity | null> {
    const cached = this.modelEntityCache.get(fullyQualifiedId);
    if (cached) {
      return cached;
    }

    const providerEntity = await this.getProviderEntity(options.providerId);
    if (!providerEntity) {
      return null;
    }

    const registryEntry = this.pluginRegistryService.getPluginById<'ai'>(
      options.providerId
    );
    if (!registryEntry) {
      return null;
    }

    // Load config and create plugin instance
    const config = await this.getProviderConfigFromDb(
      options.providerId,
      registryEntry.manifest.configSchema
    );

    const pluginInstance = new registryEntry.provider({
      manifest: registryEntry.manifest,
      configValues: config ?? {},
    }) as AiProviderPlugin;

    const entity = new AiModelEntity({
      manifest: options.manifest,
      providerPluginInstance: pluginInstance,
      providerEntity,
      configSchemaService: this.configSchemaService,
    });

    this.modelEntityCache.set(fullyQualifiedId, entity);
    return entity;
  }

  /**
   * Evict provider and related model entities from cache.
   */
  private evictProviderCache(providerId: string): void {
    this.providerEntityCache.delete(providerId);

    // Evict all models for this provider
    for (const [fullyQualifiedId] of this.modelEntityCache.entries()) {
      if (fullyQualifiedId.startsWith(`${providerId}/`)) {
        this.modelEntityCache.delete(fullyQualifiedId);
      }
    }
  }

  private async getProviderConfigFromDb(
    providerId: string,
    schemaObj?: ConfigSchemaDefinition
  ) {
    const aiProviderConfig =
      await this.prismaService.aiProviderConfig.findUnique({
        where: {
          providerId,
        },
      });

    if (!aiProviderConfig) {
      return {};
    }

    try {
      return await this.configSchemaService
        .get(schemaObj)
        .processOutboundValues(aiProviderConfig?.config as ConfigValues);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Failed to decrypt data')
      ) {
        this.logger.warn(
          `Failed to decrypt config for AI provider "${providerId}", returning as is!`
        );
        return aiProviderConfig?.config as ConfigValues;
      }
      throw error;
    }
  }
}
