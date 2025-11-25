import {
  ConfigSchemaService,
  ConfigService,
  PrismaService,
} from '@/modules/common/services';
import { PluginRegistryService } from '@/modules/plugin/services';
import { selectStorageUnit } from '@/shared/selectors/storage-unit.selectors';
import { ConfigValues } from '@longpoint/config-schema';
import { Injectable } from '@nestjs/common';
import { StorageProviderEntity } from '../entities';
import { BaseStorageProviderEntity } from '../entities/base-storage-provider.entity';
import { StorageProviderNotFound } from '../storage.errors';

@Injectable()
export class StorageProviderService {
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
    const plugins = this.pluginRegistryService.listPlugins('storage');
    return plugins.map((entry) => {
      return new BaseStorageProviderEntity({
        configSchemaService: this.configSchemaService,
        id: entry.derivedId,
        displayName: entry.manifest.displayName,
        image: entry.manifest.image,
        configSchema: entry.manifest.configSchema,
      });
    });
  }

  async getProviderById(
    id: string,
    configFromDb: ConfigValues
  ): Promise<StorageProviderEntity | null> {
    const registryEntry =
      this.pluginRegistryService.getPluginById<'storage'>(id);

    if (!registryEntry) {
      return null;
    }

    const StorageProviderClass = registryEntry.provider;
    const schemaObj = registryEntry.manifest.configSchema;
    const configForUse = await this.configSchemaService
      .get(schemaObj)
      .processOutboundValues(configFromDb);

    return new StorageProviderEntity({
      configSchemaService: this.configSchemaService,
      pluginRegistryEntry: registryEntry,
      pluginInstance: new StorageProviderClass({
        baseUrl: this.configService.get('server.origin'),
        configValues: configForUse,
        manifest: registryEntry.manifest,
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
      this.pluginRegistryService.getPluginById<'storage'>(providerId);
    if (!registryEntry) {
      throw new StorageProviderNotFound(providerId);
    }
    return await this.configSchemaService
      .get(registryEntry.manifest.configSchema)
      .processInboundValues(configValues);
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
