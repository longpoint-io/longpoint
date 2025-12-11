import { ConfigValues } from '@longpoint/config-schema';
import { join } from 'path';
import { selectStorageUnit } from '../../../shared/selectors/storage-unit.selectors';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import {
  StorageUnitDto,
  StorageUnitSummaryDto,
  UpdateStorageUnitDto,
} from '../dtos';
import { StorageProviderService } from '../services/storage-provider.service';
import { StorageUnitService } from '../services/storage-unit.service';
import {
  CannotDeleteDefaultStorageUnit,
  StorageUnitNotFound,
} from '../storage.errors';
import { StorageProviderEntity } from './storage-provider.entity';

export interface StorageUnitEntityArgs {
  id: string;
  name: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  configFromDb: ConfigValues | null;
  providerId: string;
  pathPrefix: string;
  prismaService: PrismaService;
  storageUnitService: StorageUnitService;
  storageProviderService: StorageProviderService;
}

/**
 * Entity representing a storage unit with its instantiated provider.
 * Encapsulates the storage unit data and its provider instance.
 */
export class StorageUnitEntity {
  readonly id: string;
  readonly createdAt: Date;
  private _name: string;
  private _isDefault: boolean;
  private _updatedAt: Date;
  private provider: StorageProviderEntity | null = null;
  private configFromDb: ConfigValues | null;
  readonly pathPrefix: string;
  private readonly providerId: string;

  private readonly prismaService: PrismaService;
  private readonly storageUnitService: StorageUnitService;
  private readonly storageProviderService: StorageProviderService;

  constructor(args: StorageUnitEntityArgs) {
    this.id = args.id;
    this._name = args.name ?? args.id;
    this.createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.configFromDb = args.configFromDb;
    this.providerId = args.providerId;
    this._isDefault = args.isDefault;
    this.pathPrefix = args.pathPrefix;
    this.prismaService = args.prismaService;
    this.storageUnitService = args.storageUnitService;
    this.storageProviderService = args.storageProviderService;
  }

  /**
   * Updates the storage unit.
   * @param data - The update data
   * Note: Config updates should be done through the StorageProviderConfig management, not here.
   * This method only supports switching to a different config via storageProviderConfigId.
   */
  async update(data: UpdateStorageUnitDto): Promise<void> {
    try {
      if (data.isDefault === true) {
        await this.storageUnitService.ensureSingleDefault(this.id);
      }

      const updateData: {
        name?: string;
        isDefault?: boolean;
        storageConfigId?: string | null;
        provider?: string;
        config?: ConfigValues;
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.isDefault !== undefined) {
        updateData.isDefault = data.isDefault;
      }
      if (data.storageConfigId !== undefined) {
        if (data.storageConfigId) {
          const config =
            await this.storageProviderService.getProviderByStorageUnitId(
              this.id
            );
          if (!config) {
            throw new Error('Could not load current provider');
          }
          updateData.storageConfigId = data.storageConfigId;
        } else {
          updateData.storageConfigId = null;
        }
      }

      const updated = await this.prismaService.storageUnit.update({
        where: { id: this.id },
        data: updateData,
        select: selectStorageUnit(),
      });

      this._name = updated.name;
      this._isDefault = updated.isDefault;

      const configRelation = updated.storageProviderConfig as
        | { config: unknown }
        | null
        | undefined;
      if (configRelation) {
        this.configFromDb = configRelation.config as ConfigValues | null;
      }

      this._updatedAt = updated.updatedAt;

      // Evict from cache so the entity is recreated with updated data
      this.evictFromCache();
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new StorageUnitNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Deletes the storage unit, including all associated media containers and their files.
   * @throws {CannotDeleteDefaultStorageUnit} If trying to delete the last default storage unit
   * @throws {StorageUnitNotFound} If the storage unit doesn't exist
   */
  async delete(): Promise<void> {
    // Check if this is the last default storage unit
    if (this._isDefault) {
      const defaultCount = await this.prismaService.storageUnit.count({
        where: {
          isDefault: true,
        },
      });

      if (defaultCount <= 1) {
        throw new CannotDeleteDefaultStorageUnit(this.id);
      }
    }

    try {
      // Delete all assets for this storage unit
      // Cascade will handle AssetVariants, UploadTokens, and other related records
      await this.prismaService.asset.deleteMany({
        where: {
          storageUnitId: this.id,
        },
      });

      // Get the storage provider and delete all files for this storage unit
      const provider = await this.getProvider();
      const storageUnitPath = join(this.pathPrefix, this.id);
      await provider.deleteDirectory(storageUnitPath);

      await this.prismaService.storageUnit.delete({
        where: { id: this.id },
      });

      this.evictFromCache();
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new StorageUnitNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Get the underlying storage provider for this storage unit.
   * @returns The storage provider entity.
   */
  async getProvider(): Promise<StorageProviderEntity> {
    if (this.provider) {
      return this.provider;
    }

    this.provider = await this.storageProviderService.getProviderByIdOrThrow(
      this.providerId,
      this.configFromDb ?? {}
    );

    return this.provider;
  }

  async toDto(): Promise<StorageUnitDto> {
    const provider = await this.getProvider();
    return new StorageUnitDto({
      id: this.id,
      name: this._name,
      provider: provider.toShortDto(),
      isDefault: this._isDefault,
      config: await provider.processConfigFromDb(this.configFromDb ?? {}),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    });
  }

  async toSummaryDto(): Promise<StorageUnitSummaryDto> {
    const provider = await this.getProvider();
    return new StorageUnitSummaryDto({
      id: this.id,
      name: this._name,
      provider: provider.toShortDto(),
      isDefault: this._isDefault,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    });
  }

  /**
   * Evicts this entity from the cache.
   * Called internally after updates/deletes.
   */
  private evictFromCache(): void {
    this.storageUnitService.evictCache(this.id);
  }

  get name(): string {
    return this._name;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
