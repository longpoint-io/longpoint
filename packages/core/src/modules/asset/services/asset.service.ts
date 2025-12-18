import { AssetVariantType } from '@/database/generated/prisma/client';
import { CollectionNotFound } from '@/modules/collection';
import { ConfigService } from '@/modules/common/services';
import { Unexpected } from '@/shared/errors';
import { SupportedMimeType } from '@longpoint/types';
import {
  mimeTypeToAssetType,
  mimeTypeToExtension,
} from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { addHours } from 'date-fns';
import { AssetEntity, StorageUnitEntity } from '../../common/entities';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { UrlSigningService } from '../../file-delivery/services/url-signing.service';
import { StorageUnitService } from '../../storage/services/storage-unit.service';
import { AssetNotFound, AssetVariantNotFound } from '../asset.errors';
import {
  selectAsset,
  selectAssetVariant,
  SelectedAsset,
  SelectedAssetVariant,
} from '../asset.selectors';
import { CreateAssetDto, ListAssetsQueryDto } from '../dtos';
import { AssetVariantEntity } from '../entities/asset-variant.entity';

export interface CreateAssetParams {
  path: string;
  name?: string;
  mimeType: SupportedMimeType;
  classifiersOnUpload?: string[];
  uploadToken?: {
    token: string;
    expiresAt: Date;
  };
}

export interface CreateAssetVariant {
  assetId: string;
  mimeType: string;
  type: AssetVariantType;
  entryPoint: string;
  displayName?: string;
}

/**
 * Service for managing assets and their associated variants.
 * Handles creation, retrieval, and listing of assets with support
 * for upload tokens, storage units, and automatic naming.
 */
@Injectable()
export class AssetService {
  private readonly PLACEHOLDER_ASSET_NAME = 'New Media';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageUnitService: StorageUnitService,
    private readonly configService: ConfigService,
    private readonly urlSigningService: UrlSigningService,
    private readonly eventPublisher: EventPublisher
  ) {}

  /**
   * Creates a new asset with an associated primary variant and upload token.
   *
   * The asset is created in a WAITING_FOR_UPLOAD status initially.
   * An upload token is automatically generated that expires in 1 hour from creation.
   * If a name is provided and an asset with that name already exists,
   * a new name will be automatically generated with an increment counter
   * (e.g., "MyFile.jpg", "MyFile.jpg (1)", "MyFile.jpg (2)", etc.).
   *
   * @param data - Parameters for creating the asset
   * @param data.name - Optional name for the asset. If not provided, a placeholder name will be generated
   * @param data.mimeType - The MIME type of the media file
   * @param data.classifiersOnUpload - Optional array of classifier IDs to run on upload
   * @param data.collectionIds - Optional array of collection IDs to add the asset to
   *
   * @returns An object containing:
   *   - uploadToken: The generated upload token with expiration date
   *   - asset: The created AssetEntity instance
   */
  async createAsset(data: CreateAssetDto) {
    const uploadToken = this.generateUploadToken();
    const assetType = mimeTypeToAssetType(data.mimeType);
    const storageUnit = data.storageUnitId
      ? await this.storageUnitService.getStorageUnitById(data.storageUnitId)
      : await this.storageUnitService.getOrCreateDefaultStorageUnit();

    if (data.collectionIds && data.collectionIds.length > 0) {
      const collections = await this.prismaService.collection.findMany({
        where: {
          id: { in: data.collectionIds },
        },
        select: {
          id: true,
        },
      });
      const collectionIds = new Set(collections.map((c) => c.id));
      for (const collectionId of data.collectionIds) {
        if (!collectionIds.has(collectionId)) {
          throw new CollectionNotFound(collectionId);
        }
      }
    }

    const asset = await this.prismaService.asset.create({
      data: {
        name: await this.getEffectiveName(data.name),
        type: assetType,
        status: 'WAITING_FOR_UPLOAD',
        storageUnitId: storageUnit.id,
        variants: {
          create: {
            type: 'ORIGINAL',
            status: 'WAITING_FOR_UPLOAD',
            entryPoint: `original.${mimeTypeToExtension(data.mimeType)}`,
            mimeType: data.mimeType,
            uploadToken: {
              create: {
                token: uploadToken.token,
                expiresAt: uploadToken.expiresAt,
              },
            },
          },
        },
        collections:
          data.collectionIds && data.collectionIds.length > 0
            ? {
                create: data.collectionIds.map((collectionId) => ({
                  collectionId,
                })),
              }
            : undefined,
      },
      select: selectAsset(),
    });

    return {
      uploadToken,
      uploadUrl: `${this.configService.get('server.baseUrl')}/assets/${
        asset.id
      }/upload?token=${uploadToken.token}`,
      asset: await this.toAssetEntity(asset),
    };
  }

  /**
   * Retrieves an asset by its unique identifier.
   *
   * @param id - The unique identifier of the asset
   *
   * @returns The AssetEntity instance
   *
   * @throws {AssetNotFound} If the asset does not exist
   */
  async getAssetById(id: string): Promise<AssetEntity | null> {
    const asset = await this.prismaService.asset.findUnique({
      where: { id },
      select: selectAsset(),
    });

    if (!asset) {
      throw new AssetNotFound(id);
    }

    return this.toAssetEntity(asset);
  }

  /**
   * Retrieves an asset by its unique identifier, throwing an error if not found.
   *
   * This is a convenience method that ensures a non-null result. It wraps
   * getAssetById and throws if the result is null.
   *
   * @param id - The unique identifier of the asset
   *
   * @returns The AssetEntity instance (guaranteed to be non-null)
   *
   * @throws {AssetNotFound} If the asset does not exist
   */
  async getAssetByIdOrThrow(id: string): Promise<AssetEntity> {
    const asset = await this.getAssetById(id);
    if (!asset) {
      throw new AssetNotFound(id);
    }
    return asset;
  }

  async getAssetByVariantId(variantId: string): Promise<AssetEntity | null> {
    const variant = await this.prismaService.assetVariant.findUnique({
      where: { id: variantId },
      select: {
        assetId: true,
      },
    });

    if (!variant) {
      return null;
    }

    return this.getAssetById(variant.assetId);
  }

  async getAssetByVariantIdOrThrow(variantId: string): Promise<AssetEntity> {
    const asset = await this.getAssetByVariantId(variantId);
    if (!asset) {
      throw new AssetVariantNotFound(variantId);
    }
    return asset;
  }

  /**
   * Lists assets by their unique identifiers.
   *
   * @param ids - The unique identifiers of the assets
   *
   * @returns An array of AssetEntity instances matching the IDs
   */
  async listAssetsByIds(ids: string[]): Promise<AssetEntity[]> {
    const assets = await this.prismaService.asset.findMany({
      where: { id: { in: ids } },
      select: {
        ...selectAsset(),
        storageUnitId: true,
      },
    });

    const entities = await Promise.all(
      assets.map((asset) => this.toAssetEntity(asset))
    );

    return entities;
  }

  async listAssets(query?: ListAssetsQueryDto) {
    const where: any = {
      deletedAt: null,
    };

    if (query?.collectionIds && query.collectionIds.length > 0) {
      where.collections = {
        some: {
          collectionId: {
            in: query.collectionIds,
          },
        },
      };
    }

    const assets = await this.prismaService.asset.findMany({
      ...(query?.toPrisma() ?? {}),
      where,
      select: selectAsset(),
    });

    return Promise.all(assets.map(async (a) => this.toAssetEntity(a)));
  }

  async createAssetVariant(params: CreateAssetVariant) {
    const variant = await this.prismaService.assetVariant.create({
      data: {
        assetId: params.assetId,
        mimeType: params.mimeType,
        status: 'PROCESSING',
        entryPoint: params.entryPoint,
        type: params.type,
        displayName: params.displayName,
      },
      select: selectAssetVariant(),
    });
    return new AssetVariantEntity({
      ...variant,
      storageUnit: await this.storageUnitService.getStorageUnitByAssetId(
        params.assetId
      ),
      urlSigningService: this.urlSigningService,
      prismaService: this.prismaService,
      eventPublisher: this.eventPublisher,
    });
  }

  async getAssetVariantById(id: string): Promise<AssetVariantEntity | null> {
    const variant = await this.prismaService.assetVariant.findUnique({
      where: { id },
      select: selectAssetVariant(),
    });
    if (!variant) {
      return null;
    }
    return new AssetVariantEntity({
      ...variant,
      urlSigningService: this.urlSigningService,
      storageUnit: await this.storageUnitService.getStorageUnitByAssetId(
        variant.assetId
      ),
      prismaService: this.prismaService,
      eventPublisher: this.eventPublisher,
    });
  }

  async getAssetVariantByIdOrThrow(id: string): Promise<AssetVariantEntity> {
    const variant = await this.getAssetVariantById(id);
    if (!variant) {
      throw new AssetVariantNotFound(id);
    }
    return variant;
  }

  private async toAssetEntity(asset: SelectedAsset): Promise<AssetEntity> {
    const original = asset.variants.find(
      (v) => v.type === AssetVariantType.ORIGINAL
    );
    if (!original) {
      throw new Unexpected(
        `Expected original variant for asset ${asset.id}! Not found.`
      );
    }
    const derivatives = asset.variants.filter(
      (v) => v.type === AssetVariantType.DERIVATIVE
    );
    const thumbnails = asset.variants.filter(
      (v) => v.type === AssetVariantType.THUMBNAIL
    );
    const storageUnit = await this.storageUnitService.getStorageUnitByAssetId(
      asset.id
    );
    return new AssetEntity({
      ...asset,
      original: this.toAssetVariantEntity(original, storageUnit),
      derivatives: derivatives.map((v) =>
        this.toAssetVariantEntity(v, storageUnit)
      ),
      thumbnails: thumbnails.map((v) =>
        this.toAssetVariantEntity(v, storageUnit)
      ),
      storageUnit,
      prismaService: this.prismaService,
      pathPrefix: this.configService.get('storage.pathPrefix'),
      eventPublisher: this.eventPublisher,
    });
  }

  private toAssetVariantEntity(
    variant: SelectedAssetVariant,
    storageUnit: StorageUnitEntity
  ): AssetVariantEntity {
    return new AssetVariantEntity({
      ...variant,
      storageUnit,
      urlSigningService: this.urlSigningService,
      prismaService: this.prismaService,
      eventPublisher: this.eventPublisher,
    });
  }

  /**
   * Determines the effective name to use for an asset.
   *
   * If a name is provided, it checks for conflicts and automatically generates
   * a new name with an increment counter if an asset with the same name
   * already exists (e.g., "MyFile.jpg", "MyFile.jpg (1)", "MyFile.jpg (2)", etc.).
   * If no name is provided, generates a placeholder name by finding the next available
   * sequential placeholder name (e.g., "New Media", "New Media 1", "New Media 2", etc.).
   *
   * @param name - Optional explicit name for the asset
   *
   * @returns The effective name to use for the asset
   *
   * @throws {Error} If the maximum number of assets (9999) is exceeded
   */
  private async getEffectiveName(name?: string) {
    if (name) {
      const existingAsset = await this.prismaService.asset.findFirst({
        where: {
          name,
          deletedAt: null,
        },
      });

      if (!existingAsset) {
        return name;
      }

      const counterPattern = /^(.+?)\s+\((\d+)\)$/;
      const match = name.match(counterPattern);
      const baseName = match ? match[1] : name;

      const allAssets = await this.prismaService.asset.findMany({
        where: {
          name: {
            startsWith: baseName,
          },
          deletedAt: null,
        },
        select: {
          name: true,
        },
      });

      const existingCounters = new Set<number>();

      if (allAssets.some((a) => a.name === baseName)) {
        existingCounters.add(0);
      }

      // Extract counters from names like "baseName (1)", "baseName (2)", etc.
      for (const asset of allAssets) {
        const assetMatch = asset.name.match(counterPattern);
        if (assetMatch && assetMatch[1] === baseName) {
          const counter = parseInt(assetMatch[2], 10);
          existingCounters.add(counter);
        }
      }

      let counter = 1;
      const MAX_COUNTER = 9999;

      while (counter <= MAX_COUNTER && existingCounters.has(counter)) {
        counter++;
      }

      if (counter > MAX_COUNTER) {
        throw new Error(
          `Maximum number of assets (${MAX_COUNTER}) exceeded for name "${baseName}"`
        );
      }

      return `${baseName} (${counter})`;
    }

    const assets = await this.prismaService.asset.findMany({
      where: {
        name: {
          startsWith: this.PLACEHOLDER_ASSET_NAME,
        },
        deletedAt: null,
      },
    });

    let counter = 1;
    const MAX_COUNTER = 9999;
    const assetNames = new Set<string>(assets.map((a) => a.name));

    const baseExists = assetNames.has(this.PLACEHOLDER_ASSET_NAME);

    if (!baseExists) {
      return this.PLACEHOLDER_ASSET_NAME;
    } else {
      while (
        counter <= MAX_COUNTER &&
        assetNames.has(`${this.PLACEHOLDER_ASSET_NAME} ${counter}`)
      ) {
        counter++;
      }

      if (counter > MAX_COUNTER) {
        throw new Error(
          `Maximum number of placeholder assets (${MAX_COUNTER}) exceeded`
        );
      }

      return `${this.PLACEHOLDER_ASSET_NAME} ${counter}`;
    }
  }

  /**
   * Generates a secure upload token with a 1-hour expiration.
   *
   * The token is a cryptographically secure random 32-byte hex string.
   * The expiration time is set to 1 hour from the current time.
   *
   * @returns An object containing:
   *   - token: A random hex string (64 characters)
   *   - expiresAt: The expiration date/time (1 hour from now)
   */
  private generateUploadToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 1);
    return { token, expiresAt };
  }
}
