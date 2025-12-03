import { Prisma } from '@/database';
import { ConfigValues } from '@longpoint/config-schema';
import { Injectable } from '@nestjs/common';
import type { SelectedStorageUnit } from '../../../shared/selectors/storage-unit.selectors';
import { selectStorageUnit } from '../../../shared/selectors/storage-unit.selectors';
import { ConfigService, PrismaService } from '../../common/services';
import { CreateStorageUnitDto, ListStorageUnitsQueryDto } from '../dtos';
import { StorageUnitEntity } from '../entities/storage-unit.entity';
import { StorageUnitNotFound } from '../storage.errors';
import { StorageProviderConfigService } from './storage-provider-config.service';
import { StorageProviderService } from './storage-provider.service';

/**
 * StorageUnitService handles instantiation and caching of storage unit entities
 * based on storage units. Supports core providers (local, s3, gcs, azure-blob).
 * Caches StorageUnitEntity instances which encapsulate both the storage unit data
 * and the instantiated provider.
 */
@Injectable()
export class StorageUnitService {
  private readonly entityCache = new Map<string, StorageUnitEntity>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageProviderService: StorageProviderService,
    private readonly storageProviderConfigService: StorageProviderConfigService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Get or create the default storage unit entity.
   * If no default unit exists, creates a local storage unit with default configuration.
   *
   * @returns The default storage unit entity
   */
  async getOrCreateDefaultStorageUnit(): Promise<StorageUnitEntity> {
    const defaultUnit = await this.prismaService.storageUnit.findFirst({
      where: {
        isDefault: true,
      },
      select: selectStorageUnit(),
    });

    if (!defaultUnit) {
      const created = await this.createDefaultStorageUnit();
      return this.getEntityByStorageUnit(created);
    }

    return this.getEntityByStorageUnit(defaultUnit);
  }

  /**
   * Get a storage unit entity by ID.
   * If no storage unit ID is provided, returns the default entity.
   *
   * @param storageUnitId - The storage unit id
   * @returns The storage unit entity
   */
  async getStorageUnitById(
    storageUnitId: string | null
  ): Promise<StorageUnitEntity> {
    if (!storageUnitId) {
      return this.getOrCreateDefaultStorageUnit();
    }

    const cachedEntity = this.entityCache.get(storageUnitId);
    if (cachedEntity) {
      return cachedEntity;
    }

    const storageUnit = await this.prismaService.storageUnit.findUnique({
      where: {
        id: storageUnitId,
      },
      select: selectStorageUnit(),
    });

    if (!storageUnit) {
      throw new Error(`Storage unit with id ${storageUnitId} not found`);
    }

    return this.getEntityByStorageUnit(storageUnit);
  }

  /**
   * Get the storage unit entity for an asset.
   *
   * @param assetId - The asset id
   * @returns The storage unit entity for the asset
   */
  async getStorageUnitByAssetId(assetId: string): Promise<StorageUnitEntity> {
    const asset = await this.prismaService.asset.findUnique({
      where: {
        id: assetId,
      },
      select: {
        storageUnitId: true,
      },
    });

    if (!asset) {
      throw new Error(`Asset with id ${assetId} not found`);
    }

    return this.getStorageUnitById(asset.storageUnitId);
  }

  /**
   * Manually evict a storage unit entity from the cache.
   * @param storageUnitId - The storage unit id
   */
  evictCache(storageUnitId: string) {
    this.entityCache.delete(storageUnitId);
  }

  /**
   * Get a storage unit entity
   * @returns The storage unit entity
   */
  private async getEntityByStorageUnit(
    storageUnit: SelectedStorageUnit
  ): Promise<StorageUnitEntity> {
    const cachedEntity = this.entityCache.get(storageUnit.id);

    if (cachedEntity) {
      return cachedEntity;
    }

    if (!storageUnit.storageProviderConfig) {
      throw new Error(
        `Storage unit ${storageUnit.id} does not have a storage provider config`
      );
    }

    const providerId = storageUnit.storageProviderConfig.provider;
    const configFromDb = storageUnit.storageProviderConfig
      .config as ConfigValues | null;

    const pathPrefix = this.configService.get('storage.pathPrefix');
    const entity = new StorageUnitEntity({
      id: storageUnit.id,
      name: storageUnit.name,
      isDefault: storageUnit.isDefault,
      createdAt: storageUnit.createdAt,
      updatedAt: storageUnit.updatedAt,
      providerId,
      configFromDb,
      pathPrefix,
      storageProviderService: this.storageProviderService,
      prismaService: this.prismaService,
      storageUnitService: this,
    });

    this.entityCache.set(storageUnit.id, entity);

    return entity;
  }

  /**
   * Create a default local storage unit if none exists.
   */
  private async createDefaultStorageUnit(): Promise<SelectedStorageUnit> {
    const providerId = 'storage-local';

    const defaultConfig = await this.storageProviderConfigService.createConfig({
      name: 'Default Config',
      providerId,
    });

    const storageUnit = await this.prismaService.storageUnit.create({
      data: {
        name: 'Default',
        isDefault: true,
        storageProviderConfigId: defaultConfig.id,
      },
      select: selectStorageUnit(),
    });

    return storageUnit;
  }

  /**
   * Creates a new storage unit.
   * @param data - The storage unit data
   * @returns The created storage unit entity
   */
  async createStorageUnit(
    data: CreateStorageUnitDto
  ): Promise<StorageUnitEntity> {
    if (data.isDefault === true) {
      await this.ensureSingleDefault();
    }

    const config = await this.storageProviderConfigService.getConfigByIdOrThrow(
      data.storageConfigId
    );

    const storageUnit = await this.prismaService.storageUnit.create({
      data: {
        name: data.name,
        isDefault: data.isDefault ?? false,
        storageProviderConfigId: config.id,
      },
      select: selectStorageUnit(),
    });

    return this.getEntityByStorageUnit(storageUnit);
  }

  /**
   * Lists storage units with optional pagination and filtering.
   * @param query - Optional pagination query
   * @param storageProviderConfigId - Optional filter by storage provider config ID
   * @returns Array of storage unit entities
   */
  async listStorageUnits(
    query?: ListStorageUnitsQueryDto
  ): Promise<StorageUnitEntity[]> {
    const where: Prisma.StorageUnitWhereInput = {};
    if (query?.configId) {
      where.storageProviderConfigId = query.configId;
    }

    const paginationOptions = query?.toPrisma() ?? {
      take: 100,
      skip: 0,
      cursor: undefined,
      orderBy: [{ id: Prisma.SortOrder.desc }],
    };

    const storageUnits = await this.prismaService.storageUnit.findMany({
      where,
      select: selectStorageUnit(),
      ...paginationOptions,
    });

    return Promise.all(
      storageUnits.map((unit) => this.getEntityByStorageUnit(unit))
    );
  }

  /**
   * Gets a storage unit by ID or throws an error if not found.
   * @param id - The storage unit ID
   * @returns The storage unit entity
   * @throws {StorageUnitNotFound} If the storage unit doesn't exist
   */
  async getStorageUnitByIdOrThrow(id: string): Promise<StorageUnitEntity> {
    const storageUnit = await this.prismaService.storageUnit.findUnique({
      where: { id },
      select: selectStorageUnit(),
    });

    if (!storageUnit) {
      throw new StorageUnitNotFound(id);
    }

    return this.getEntityByStorageUnit(storageUnit);
  }

  /**
   * Ensures only one storage unit is marked as default.
   * If multiple exist, keeps the first one and sets others to false.
   * @param excludeId - Optional ID to exclude from being set to non-default (e.g., the one being set to default)
   */
  async ensureSingleDefault(excludeId?: string): Promise<void> {
    const defaultUnit = await this.prismaService.storageUnit.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'asc' },
    });

    if (defaultUnit) {
      const whereClause: any = {
        isDefault: true,
      };

      // If excludeId is provided, don't update that one
      if (excludeId) {
        whereClause.id = { not: excludeId };
      } else {
        whereClause.id = { not: defaultUnit.id };
      }

      const updated = await this.prismaService.storageUnit.updateManyAndReturn({
        where: whereClause,
        data: {
          isDefault: false,
        },
      });

      for (const unit of updated) {
        this.evictCache(unit.id);
      }
    }
  }
}
