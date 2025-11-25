import { ConfigSchemaService } from '@/modules/common/services';
import {
  ClassificationProviderRegistryEntry,
  PluginRegistryService,
} from '@/modules/plugin/services';
import { InvalidInput } from '@/shared/errors';
import {
  ClassificationProvider,
  ClassificationProviderArgs,
} from '@longpoint/devkit/classifier';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { ClassificationProviderNotFound } from '../classifier.errors';
import { ClassificationProviderEntity } from '../entities/classification-provider.entity';

@Injectable()
export class ClassificationProviderService {
  private readonly logger = new Logger(ClassificationProviderService.name);
  private readonly providerEntityCache = new Map<
    string,
    ClassificationProviderEntity
  >();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  /**
   * List all installed classification providers.
   * @returns A list of classification provider entities.
   */
  async listClassificationProviders(): Promise<ClassificationProviderEntity[]> {
    const registryEntries =
      this.pluginRegistryService.listClassificationProviders();
    const providers: ClassificationProviderEntity[] = [];

    for (const registryEntry of registryEntries) {
      const provider = await this.getProviderEntity(registryEntry.fullyQualifiedId);
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get a classification provider by its fully qualified ID.
   * @param fullyQualifiedId - The fully qualified ID of the provider (e.g., 'openai/gpt-5-nano-2025-08-07').
   * @returns The classification provider entity, or `null` if not found.
   */
  async getClassificationProviderById(
    fullyQualifiedId: string
  ): Promise<ClassificationProviderEntity | null> {
    return this.getProviderEntity(fullyQualifiedId);
  }

  /**
   * Get a classification provider by its fully qualified ID and throw an error if it is not found.
   * @param fullyQualifiedId - The fully qualified ID of the provider.
   * @returns The classification provider entity.
   * @throws {ClassificationProviderNotFound} If the provider is not found.
   */
  async getClassificationProviderByIdOrThrow(
    fullyQualifiedId: string
  ): Promise<ClassificationProviderEntity> {
    const provider = await this.getClassificationProviderById(fullyQualifiedId);
    if (!provider) {
      throw new ClassificationProviderNotFound(fullyQualifiedId);
    }
    return provider;
  }

  /**
   * Update the configuration values for a plugin.
   * @param pluginId - The ID of the plugin to update.
   * @param configValues - The configuration values to update.
   * @returns The updated plugin settings config.
   */
  async updatePluginSettings(
    pluginId: string,
    configValues: ConfigValues
  ): Promise<ConfigValues> {
    const registryEntries =
      this.pluginRegistryService.listClassificationProviders();
    const pluginEntry = registryEntries.find(
      (entry) => entry.pluginId === pluginId
    );

    if (!pluginEntry) {
      throw new ClassificationProviderNotFound(pluginId);
    }

    const settingsSchema = pluginEntry.pluginConfig.contributes?.settings;
    if (!settingsSchema) {
      throw new InvalidInput('Plugin does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(settingsSchema)
      .processInboundValues(configValues);

    await this.prismaService.pluginSettings.upsert({
      where: { pluginId },
      update: { config: inboundConfig },
      create: { pluginId, config: inboundConfig },
    });

    // Evict all classification providers for this plugin from cache
    this.evictPluginCache(pluginId);

    return inboundConfig;
  }

  /**
   * Get or create a provider entity, loading config lazily.
   */
  private async getProviderEntity(
    fullyQualifiedId: string
  ): Promise<ClassificationProviderEntity | null> {
    const cached = this.providerEntityCache.get(fullyQualifiedId);
    if (cached) {
      return cached;
    }

    const registryEntry =
      this.pluginRegistryService.getClassificationProviderById(fullyQualifiedId);
    if (!registryEntry) {
      return null;
    }

    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    const providerInstance = new registryEntry.contribution.provider({
      pluginSettings: pluginSettings ?? {},
      providerId: registryEntry.classifierId,
    } as ClassificationProviderArgs<any>);

    const entity = new ClassificationProviderEntity({
      registryEntry,
      providerInstance,
      configSchemaService: this.configSchemaService,
    });

    this.providerEntityCache.set(fullyQualifiedId, entity);
    return entity;
  }

  /**
   * Evict classification provider entities from cache for a plugin.
   */
  private evictPluginCache(pluginId: string): void {
    for (const [fullyQualifiedId] of this.providerEntityCache.entries()) {
      if (fullyQualifiedId.startsWith(`${pluginId}/`)) {
        this.providerEntityCache.delete(fullyQualifiedId);
      }
    }
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

