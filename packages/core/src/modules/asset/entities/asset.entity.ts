import { AssetStatus, AssetType, Prisma } from '@/database';
import {
  CollectionNotFound,
  CollectionReferenceDto,
} from '@/modules/collection';
import { getAssetPath } from '@/shared/utils/asset.utils';
import { SearchDocument } from '@longpoint/devkit';
import { JsonObject } from '@longpoint/types';
import { formatBytes } from '@longpoint/utils/format';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { StorageUnitEntity } from '../../storage/entities/storage-unit.entity';
import {
  AssetAlreadyDeleted,
  AssetAlreadyExists,
  AssetNotFound,
} from '../asset.errors';
import { AssetEventKey } from '../asset.events';
import { SelectedAsset, selectAsset } from '../asset.selectors';
import { UpdateAssetDto } from '../dtos';
import {
  AssetDetailsDto,
  AssetDto,
  AssetReferenceDto,
} from '../dtos/containers/asset.dto';
import { AssetVariantEntity } from './asset-variant.entity';

export interface AssetEntityArgs extends SelectedAsset {
  original: AssetVariantEntity;
  derivatives: AssetVariantEntity[];
  thumbnails: AssetVariantEntity[];
  storageUnit: StorageUnitEntity;
  prismaService: PrismaService;
  pathPrefix?: string;
  eventPublisher: EventPublisher;
}

export class AssetEntity {
  readonly id: string;
  readonly original: AssetVariantEntity;
  readonly derivatives: AssetVariantEntity[];
  readonly thumbnails: AssetVariantEntity[];

  private _name: string;
  private _type: AssetType;
  private _status: AssetStatus;
  private _metadata: JsonObject | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private readonly storageUnit: StorageUnitEntity;
  private readonly prismaService: PrismaService;
  private readonly pathPrefix?: string;
  private readonly eventPublisher: EventPublisher;

  constructor(args: AssetEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._type = args.type;
    this._status = args.status;
    this._metadata = (args.metadata as JsonObject | null) ?? null;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.storageUnit = args.storageUnit;
    this.prismaService = args.prismaService;
    this.pathPrefix = args.pathPrefix;
    this.eventPublisher = args.eventPublisher;
    this.original = args.original;
    this.derivatives = args.derivatives;
    this.thumbnails = args.thumbnails;
  }

  async update(data: UpdateAssetDto) {
    const {
      name: newName,
      collectionIds: newCollectionIds,
      metadata: newMetadata,
    } = data;

    if (newName && newName !== this._name) {
      const existingAsset = await this.prismaService.asset.findFirst({
        where: {
          name: newName,
          deletedAt: null,
          id: { not: this.id },
        },
      });

      if (existingAsset) {
        throw new AssetAlreadyExists(newName);
      }
    }

    let collectionsUpdate: Prisma.AssetCollectionUncheckedUpdateManyWithoutAssetNestedInput =
      {};

    let allUpdateIds: string[] = [];

    if (newCollectionIds !== undefined) {
      const currentCollections =
        await this.prismaService.assetCollection.findMany({
          where: { assetId: this.id },
          select: { collectionId: true },
        });
      const currentIds = new Set(currentCollections.map((c) => c.collectionId));
      const newIds = new Set(newCollectionIds);

      if (newCollectionIds.length > 0) {
        const dbCollections = await this.prismaService.collection.findMany({
          where: {
            id: { in: newCollectionIds },
          },
          select: { id: true },
        });
        const dbIds = new Set(dbCollections.map((c) => c.id));
        for (const collectionId of newCollectionIds) {
          if (!dbIds.has(collectionId)) {
            throw new CollectionNotFound(collectionId);
          }
        }
      }

      const toAdd = newCollectionIds.filter((id) => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id));
      allUpdateIds = [...toAdd, ...toRemove];

      collectionsUpdate = {
        createMany: {
          data: toAdd.map((id) => ({ collectionId: id })),
        },
        deleteMany: {
          collectionId: {
            in: toRemove,
          },
        },
      };
    }

    try {
      const updated = await this.prismaService.$transaction(async (tx) => {
        if (allUpdateIds.length > 0) {
          await tx.collection.updateMany({
            where: {
              id: { in: allUpdateIds },
            },
            data: {
              updatedAt: new Date(),
            },
          });
        }
        return await tx.asset.update({
          where: { id: this.id },
          data: {
            ...(newName !== undefined && { name: newName }),
            ...(newMetadata !== undefined && { metadata: newMetadata }),
            collections: collectionsUpdate,
          },
          select: selectAsset(),
        });
      });

      this._name = updated.name;
      this._type = updated.type;
      this._status = updated.status as AssetStatus;
      this._metadata = (updated.metadata as JsonObject | null) ?? null;
      this._createdAt = updated.createdAt;
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new AssetNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Deletes the asset.
   * @param permanently Whether to permanently delete the asset.
   */
  async delete(permanently = false): Promise<void> {
    try {
      if (permanently) {
        await this.prismaService.asset.delete({
          where: { id: this.id },
        });
        const provider = await this.storageUnit.getProvider();
        await provider.deleteDirectory(
          getAssetPath({
            assetId: this.id,
            storageUnitId: this.storageUnit.id,
            prefix: this.pathPrefix,
          })
        );
        await this.eventPublisher.publish(AssetEventKey.ASSET_DELETED, {
          assetIds: [this.id],
        });
        return;
      }

      if (this.status === 'DELETED') {
        throw new AssetAlreadyDeleted(this.id);
      }

      const updated = await this.prismaService.asset.update({
        where: { id: this.id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
        select: selectAsset(),
      });

      this._status = updated.status;
      await this.eventPublisher.publish(AssetEventKey.ASSET_DELETED, {
        assetIds: [this.id],
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new AssetNotFound(this.id);
      }
      throw e;
    }
  }

  toReferenceDto(): AssetReferenceDto {
    return new AssetReferenceDto({
      id: this.id,
      name: this.name,
    });
  }

  toDto(): AssetDto {
    return new AssetDto({
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      thumbnails: this.thumbnails.map((t) => t.toDto()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    });
  }

  async toDetailsDto(): Promise<AssetDetailsDto> {
    const collections = await this.prismaService.assetCollection.findMany({
      where: { assetId: this.id },
      select: {
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return new AssetDetailsDto({
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      thumbnails: this.thumbnails.map((t) => t.toDto()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
      totalSize: this.totalSize,
      totalVariants: this.totalVariants,
      original: this.original.toDto(),
      derivatives: this.derivatives.map((d) => d.toDto()),
      collections: collections.map(
        (c) => new CollectionReferenceDto(c.collection)
      ),
    });
  }

  /**
   * Builds an embedding-friendly document from this asset.
   * Aggregates asset metadata, variant information, and classifier results
   * into a format suitable for generating vector embeddings.
   *
   * @returns The text content for the search document
   */
  toSearchDocument(): Omit<SearchDocument, 'id'> {
    const textParts: string[] = [`Name: ${this.name}`, `Type: ${this.type}`];

    const originalDimensions =
      this.original.width && this.original.height
        ? `${this.original.width}x${this.original.height}`
        : undefined;

    textParts.push(
      `Original Format: ${this.original.mimeType}`,
      originalDimensions ? `Original Dimensions: ${originalDimensions}` : '',
      this.original.size
        ? `Original Size: ${formatBytes(this.original.size)}`
        : '',
      this.original.aspectRatio
        ? `Original Aspect Ratio: ${this.original.aspectRatio.toFixed(2)}`
        : '',
      this.original.duration
        ? `Duration: ${this.original.duration} seconds`
        : '',
      this.original.metadata
        ? `Original Metadata: ${this.formatMetadataForDocument(
            this.original.metadata
          )}`
        : ''
    );

    this.derivatives.forEach((derivative, index) => {
      const derivativeLabel =
        derivative.displayName || `Derivative ${index + 1}`;
      const derivativeDimensions =
        derivative.width && derivative.height
          ? `${derivative.width}x${derivative.height}`
          : undefined;

      textParts.push(
        `${derivativeLabel} Format: ${derivative.mimeType}`,
        derivativeDimensions
          ? `${derivativeLabel} Dimensions: ${derivativeDimensions}`
          : '',
        derivative.size
          ? `${derivativeLabel} Size: ${formatBytes(derivative.size)}`
          : '',
        derivative.aspectRatio
          ? `${derivativeLabel} Aspect Ratio: ${derivative.aspectRatio.toFixed(
              2
            )}`
          : '',
        derivative.duration
          ? `${derivativeLabel} Duration: ${derivative.duration} seconds`
          : '',
        derivative.metadata
          ? `${derivativeLabel} Metadata: ${this.formatMetadataForDocument(
              derivative.metadata
            )}`
          : ''
      );
    });

    // Aggregate information
    textParts.push(`Total Size: ${formatBytes(this.totalSize)}`);

    const text = textParts.filter(Boolean).join(', ');

    return {
      textOrEmbedding: text,
      metadata: {
        type: this.type,
        storageUnitId: this.storageUnit.id,
        ...(this.metadata ? this.metadata : {}),
      },
    };
  }

  /**
   * Formats classifier result JSON into a readable string for embedding.
   */
  private formatMetadataForDocument(result: JsonObject): string {
    if (typeof result === 'string') {
      return result;
    }
    if (Array.isArray(result)) {
      return result.map((item) => String(item)).join(', ');
    }
    if (typeof result === 'object' && result !== null) {
      return Object.entries(result)
        .map(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            return `${key}: ${value}`;
          }
          if (typeof value === 'boolean') {
            return `${key}: ${value ? 'yes' : 'no'}`;
          }
          return `${key}: ${JSON.stringify(value)}`;
        })
        .join(', ');
    }
    return String(result);
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get status() {
    return this._status;
  }

  get metadata() {
    return this._metadata;
  }

  get totalSize() {
    return (
      (this.original.size ?? 0) +
      this.derivatives.reduce((acc, d) => acc + (d.size ?? 0), 0) +
      this.thumbnails.reduce((acc, t) => acc + (t.size ?? 0), 0)
    );
  }

  get totalVariants() {
    return 1 + this.derivatives.length + this.thumbnails.length; // 1 for original
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}
