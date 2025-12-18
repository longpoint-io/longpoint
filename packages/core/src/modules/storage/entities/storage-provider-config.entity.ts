import { ConfigValues } from '@longpoint/config-schema';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import {
  StorageConfigDetailsDto,
  StorageConfigDto,
  StorageConfigReferenceDto,
  UpdateStorageConfigDto,
} from '../dtos';
import { StorageProviderConfigService } from '../services/storage-provider-config.service';
import { StorageProviderService } from '../services/storage-provider.service';
import {
  StorageProviderConfigInUse,
  StorageProviderConfigNotFound,
} from '../storage.errors';
import { StorageProviderEntity } from './storage-provider.entity';

export interface StorageProviderConfigEntityArgs {
  id: string;
  name: string;
  provider: StorageProviderEntity;
  configFromDb: ConfigValues | null;
  createdAt: Date;
  updatedAt: Date;
  prismaService: PrismaService;
  storageProviderConfigService: StorageProviderConfigService;
  storageProviderService: StorageProviderService;
}

/**
 * Entity representing a storage provider configuration.
 * Encapsulates the config data and provides methods for updates and deletion.
 */
export class StorageProviderConfigEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly provider: StorageProviderEntity;
  private _name: string;
  private _updatedAt: Date;
  private configFromDb: ConfigValues | null;

  private readonly prismaService: PrismaService;
  private readonly storageProviderConfigService: StorageProviderConfigService;
  private readonly storageProviderService: StorageProviderService;

  constructor(args: StorageProviderConfigEntityArgs) {
    this.id = args.id;
    this.provider = args.provider;
    this._name = args.name;
    this.createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.configFromDb = args.configFromDb;
    this.prismaService = args.prismaService;
    this.storageProviderConfigService = args.storageProviderConfigService;
    this.storageProviderService = args.storageProviderService;
  }

  /**
   * Updates the storage provider config.
   * @param data - The update data (config should be in decrypted form)
   */
  async update(data: UpdateStorageConfigDto): Promise<void> {
    try {
      let configForDb: ConfigValues | null = null;
      if (data.config !== undefined) {
        configForDb = await this.storageProviderService.processConfigForDb(
          this.provider.id,
          data.config
        );
      }

      const updateData: {
        name?: string;
        config?: ConfigValues;
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (configForDb !== null) {
        updateData.config = configForDb;
      }

      const updated = await this.prismaService.storageProviderConfig.update({
        where: { id: this.id },
        data: updateData,
      });

      this._name = updated.name;
      this.configFromDb = updateData.config ?? this.configFromDb;
      this._updatedAt = updated.updatedAt;

      // Evict from cache so the entity is recreated with updated data
      this.evictFromCache();
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new StorageProviderConfigNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Deletes the storage provider config.
   * @throws {StorageProviderConfigInUse} If the config is used by storage units
   */
  async delete(): Promise<void> {
    const usageCount = await this.getUsageCount();

    if (usageCount > 0) {
      throw new StorageProviderConfigInUse(this.id, usageCount);
    }

    try {
      await this.prismaService.storageProviderConfig.delete({
        where: { id: this.id },
      });

      this.evictFromCache();
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new StorageProviderConfigNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Get the number of storage units using this config.
   * @returns The count of storage units using this config
   */
  async getUsageCount(): Promise<number> {
    return await this.prismaService.storageUnit.count({
      where: {
        storageProviderConfigId: this.id,
      },
    });
  }

  /**
   * Get the decrypted config values.
   * @returns The decrypted config values
   */
  async getConfig(): Promise<ConfigValues> {
    return await this.provider.processConfigFromDb(this.configFromDb ?? {});
  }

  toReferenceDto(): StorageConfigReferenceDto {
    return new StorageConfigReferenceDto({
      id: this.id,
      name: this._name,
    });
  }

  async toDto(): Promise<StorageConfigDto> {
    const storageUnitCount = await this.getUsageCount();
    return new StorageConfigDto({
      id: this.id,
      name: this._name,
      provider: this.provider.toDto(),
      storageUnitCount,
    });
  }

  async toDetailsDto(): Promise<StorageConfigDetailsDto> {
    const config = await this.getConfig();
    const storageUnitCount = await this.getUsageCount();
    return new StorageConfigDetailsDto({
      id: this.id,
      name: this._name,
      provider: this.provider.toDto(),
      storageUnitCount,
      config,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    });
  }

  /**
   * Evicts this entity from the cache.
   * Called internally after updates/deletes.
   */
  private evictFromCache(): void {
    this.storageProviderConfigService.evictCache(this.id);
  }

  get name(): string {
    return this._name;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
