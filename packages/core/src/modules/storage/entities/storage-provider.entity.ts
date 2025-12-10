import { ConfigSchemaService } from '@/modules/common/services';
import { StorageProviderRegistryEntry } from '@/modules/plugin/services';
import {
  FileStats,
  GetFileStreamOptions,
  StorageProvider,
} from '@longpoint/devkit';
import { Readable } from 'stream';
import { BaseStorageProviderEntity } from './base-storage-provider.entity';

export interface StorageProviderEntityArgs {
  pluginInstance: StorageProvider;
  registryEntry: StorageProviderRegistryEntry;
  configSchemaService: ConfigSchemaService;
}

export class StorageProviderEntity extends BaseStorageProviderEntity {
  private readonly pluginInstance: StorageProvider;

  constructor(args: StorageProviderEntityArgs) {
    const { registryEntry } = args;
    super({
      id: registryEntry.fullyQualifiedId,
      displayName:
        registryEntry.contribution.displayName ??
        registryEntry.pluginConfig.displayName ??
        registryEntry.storageId,
      image: registryEntry.pluginConfig.icon,
      configSchema: registryEntry.contribution.configSchema,
      configSchemaService: args.configSchemaService,
    });
    this.pluginInstance = args.pluginInstance;
  }

  upload(path: string, body: Readable | Buffer | string): Promise<boolean> {
    return this.pluginInstance.upload(path, body);
  }

  getFileStream(
    path: string,
    options: GetFileStreamOptions = {}
  ): Promise<Readable> {
    return this.pluginInstance.getFileStream(path, options);
  }

  getFileContents(path: string): Promise<Buffer> {
    return this.pluginInstance.getFileContents(path);
  }

  exists(path: string): Promise<boolean> {
    return this.pluginInstance.exists(path);
  }

  deleteDirectory(path: string): Promise<void> {
    return this.pluginInstance.deleteDirectory(path);
  }

  getPathStats(path: string): Promise<FileStats> {
    return this.pluginInstance.getPathStats(path);
  }
}
