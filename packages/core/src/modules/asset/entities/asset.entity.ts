import {
  AssetStatus,
  AssetType,
  AssetVariantStatus,
  AssetVariantType,
  Prisma,
} from '@/database';
import {
  CollectionNotFound,
  CollectionReferenceDto,
} from '@/modules/collection';
import { getAssetPath } from '@/shared/utils/asset.utils';
import { JsonObject } from '@longpoint/types';
import { formatBytes } from '@longpoint/utils/format';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { UrlSigningService } from '../../file-delivery';
import { StorageUnitEntity } from '../../storage/entities/storage-unit.entity';
import {
  AssetAlreadyDeleted,
  AssetAlreadyExists,
  AssetNotEmbeddable,
  AssetNotFound,
} from '../asset.errors';
import { SelectedAsset, selectAsset } from '../asset.selectors';
import { AssetSummaryDto, AssetVariantsDto, UpdateAssetDto } from '../dtos';
import { AssetDto } from '../dtos/containers/asset.dto';

export interface AssetEntityArgs extends SelectedAsset {
  storageUnit: StorageUnitEntity;
  prismaService: PrismaService;
  pathPrefix: string;
  urlSigningService: UrlSigningService;
  eventPublisher: EventPublisher;
}

export class AssetEntity {
  public readonly id: string;
  private _name: string;
  private _type: AssetType;
  private _status: AssetStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private readonly storageUnit: StorageUnitEntity;
  private readonly prismaService: PrismaService;
  private readonly pathPrefix: string;
  private readonly urlSigningService: UrlSigningService;
  private readonly eventPublisher: EventPublisher;
  private variants: SelectedAsset['variants'];

  constructor(args: AssetEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._type = args.type;
    this._status = args.status;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.storageUnit = args.storageUnit;
    this.prismaService = args.prismaService;
    this.pathPrefix = args.pathPrefix;
    this.urlSigningService = args.urlSigningService;
    this.eventPublisher = args.eventPublisher;
    this.variants = args.variants;
  }

  async update(data: UpdateAssetDto) {
    const { name: newName, collectionIds: newCollectionIds } = data;

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
            name: newName,
            collections: collectionsUpdate,
          },
          select: selectAsset(),
        });
      });

      this._name = updated.name;
      this._type = updated.type;
      this._status = updated.status as AssetStatus;
      this._createdAt = updated.createdAt;
      this.variants = updated.variants as SelectedAsset['variants'];
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
        await this.eventPublisher.publish('asset.deleted', {
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
      await this.eventPublisher.publish('asset.deleted', {
        assetIds: [this.id],
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new AssetNotFound(this.id);
      }
      throw e;
    }
  }

  async toDto(): Promise<AssetDto> {
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

    return new AssetDto({
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      variants: await this.getVariants(),
      collections: collections.map(
        (c) => new CollectionReferenceDto(c.collection)
      ),
    });
  }

  async toSummaryDto(): Promise<AssetSummaryDto> {
    return new AssetSummaryDto({
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  /**
   * Builds an embedding-friendly document from this asset.
   * Aggregates asset metadata, variant information, and classifier results
   * into a format suitable for generating vector embeddings.
   *
   * @returns The embedding document, or null if the asset has no primary variant
   */
  toEmbeddingText(): string {
    const primaryVariant = this.variants.find(
      (variant) => variant.type === AssetVariantType.ORIGINAL
    );

    if (primaryVariant?.status !== AssetVariantStatus.READY) {
      throw new AssetNotEmbeddable(this.id);
    }

    const classifierResults = primaryVariant.classifierRuns.reduce(
      (acc, run) => {
        acc[run.classifier.name] = run.result as JsonObject;
        return acc;
      },
      {} as Record<string, JsonObject>
    );

    const dimensions =
      primaryVariant.width && primaryVariant.height
        ? `${primaryVariant.width}x${primaryVariant.height}`
        : undefined;

    const textParts: string[] = [
      `Name: ${this.name}`,
      `MIME Type: ${primaryVariant.mimeType}`,
      dimensions ? `Dimensions: ${dimensions}` : '',
      primaryVariant.size ? `Size: ${formatBytes(primaryVariant.size)}` : '',
      primaryVariant.aspectRatio
        ? `Aspect Ratio: ${primaryVariant.aspectRatio.toFixed(2)}`
        : '',
    ];

    for (const [classifierName, result] of Object.entries(classifierResults)) {
      const resultText = this.formatClassifierResult(result);
      textParts.push(`${classifierName}: ${resultText}`);
    }

    const text = textParts.filter(Boolean).join(', ');

    return text;
  }

  private async getVariants() {
    return new AssetVariantsDto(
      await Promise.all(
        this.variants.map(async (variant) => await this.hydrateVariant(variant))
      )
    );
  }

  private async hydrateVariant(variant: SelectedAsset['variants'][number]) {
    const url = this.urlSigningService.generateSignedUrl(
      variant.id,
      variant.entryPoint
    );

    return {
      ...variant,
      url,
    };
  }

  /**
   * Formats classifier result JSON into a readable string for embedding.
   */
  private formatClassifierResult(result: JsonObject): string {
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

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}
