import {
  ConfigSchemaService,
  ConfigService,
  PrismaService,
} from '@/modules/common/services';
import {
  PluginRegistryService,
  StorageProviderRegistryEntry,
} from '@/modules/plugin/services';
import { selectStorageUnit } from '@/shared/selectors/storage-unit.selectors';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { StorageProviderEntity } from '../entities';
import { BaseStorageProviderEntity } from '../entities/base-storage-provider.entity';
import { StorageProviderNotFound } from '../storage.errors';

@Injectable()
export class StorageProviderService {
  private readonly logger = new Logger(StorageProviderService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  /**
   * List all installed storage providers.
   * @returns A list of base storage provider entities.
   */
  async listProviders() {
    const registryEntries =
      this.pluginRegistryService.listStorageProviders();
    return registryEntries.map((entry) => {
      return new BaseStorageProviderEntity({
        configSchemaService: this.configSchemaService,
        id: entry.fullyQualifiedId,
        displayName:
          entry.contribution.displayName ??
          entry.pluginConfig.displayName ??
          entry.storageId,
        image: entry.pluginConfig.icon,
        configSchema: entry.contribution.configSchema,
      });
    });
  }

  async getProviderById(
    id: string,
    configFromDb: ConfigValues
  ): Promise<StorageProviderEntity | null> {
    const registryEntry =
      this.pluginRegistryService.getStorageProviderById(id);

    if (!registryEntry) {
      return null;
    }

    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    const schemaObj = registryEntry.contribution.configSchema;
    const providerConfig = await this.configSchemaService
      .get(schemaObj)
      .processOutboundValues(configFromDb);

    const StorageProviderClass = registryEntry.contribution.provider;

    return new StorageProviderEntity({
      configSchemaService: this.configSchemaService,
      registryEntry,
      pluginInstance: new StorageProviderClass({
        pluginSettings: pluginSettings ?? {},
        providerConfig,
        baseUrl: this.configService.get('server.origin'),
      }),
    });
  }

  async getProviderByIdOrThrow(
    id: string,
    configFromDb: ConfigValues
  ): Promise<StorageProviderEntity> {
    const provider = await this.getProviderById(id, configFromDb);
    if (!provider) {
      throw new StorageProviderNotFound(id);
    }
    return provider;
  }

  async processConfigForDb(providerId: string, configValues: ConfigValues) {
    const registryEntry =
      this.pluginRegistryService.getStorageProviderById(providerId);
    if (!registryEntry) {
      throw new StorageProviderNotFound(providerId);
    }
    return await this.configSchemaService
      .get(registryEntry.contribution.configSchema)
      .processInboundValues(configValues);
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

  async getProviderByStorageUnitId(
    id: string
  ): Promise<StorageProviderEntity | null> {
    const storageUnit = await this.prismaService.storageUnit.findUnique({
      where: { id },
      select: selectStorageUnit(),
    });

    if (!storageUnit) {
      return null;
    }

    if (!storageUnit.storageProviderConfig) {
      return null;
    }

    const providerId = storageUnit.storageProviderConfig.provider;
    const configValues =
      (storageUnit.storageProviderConfig.config as ConfigValues) ?? {};

    return this.getProviderById(providerId, configValues);
  }

  async getProviderByStorageUnitIdOrThrow(
    id: string
  ): Promise<StorageProviderEntity> {
    const provider = await this.getProviderByStorageUnitId(id);
    if (!provider) {
      throw new StorageProviderNotFound(id);
    }
    return provider;
  }
}
