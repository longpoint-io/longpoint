import {
  MediaAssetStatus,
  MediaAssetVariant,
  MediaContainerStatus,
  MediaType,
  Prisma,
} from '@/database';
import {
  CollectionNotFound,
  CollectionReferenceDto,
} from '@/modules/collection';
import { JsonObject, SupportedMimeType } from '@longpoint/types';
import { formatBytes } from '@longpoint/utils/format';
import {
  getMediaContainerPath,
  mimeTypeToExtension,
} from '@longpoint/utils/media';
import {
  SelectedMediaContainer,
  selectMediaContainer,
} from '../../../shared/selectors/media.selectors';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { UrlSigningService } from '../../file-delivery';
import { StorageUnitEntity } from '../../storage/entities/storage-unit.entity';
import {
  MediaAssetVariantsDto,
  MediaContainerSummaryDto,
  UpdateMediaContainerDto,
} from '../dtos';
import { MediaContainerDto } from '../dtos/containers/media-container.dto';
import {
  MediaContainerAlreadyDeleted,
  MediaContainerAlreadyExists,
  MediaContainerNotEmbeddable,
  MediaContainerNotFound,
} from '../media.errors';

export interface MediaContainerEntityArgs extends SelectedMediaContainer {
  storageUnit: StorageUnitEntity;
  prismaService: PrismaService;
  pathPrefix: string;
  urlSigningService: UrlSigningService;
  eventPublisher: EventPublisher;
}

export class MediaContainerEntity {
  public readonly id: string;
  private _name: string;
  private _type: MediaType;
  private _status: MediaContainerStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private readonly storageUnit: StorageUnitEntity;
  private readonly prismaService: PrismaService;
  private readonly pathPrefix: string;
  private readonly urlSigningService: UrlSigningService;
  private readonly eventPublisher: EventPublisher;
  private assets: SelectedMediaContainer['assets'];

  constructor(args: MediaContainerEntityArgs) {
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
    this.assets = args.assets;
  }

  async update(data: UpdateMediaContainerDto) {
    const { name: newName, collectionIds: newCollectionIds } = data;

    if (newName && newName !== this._name) {
      const existingContainer =
        await this.prismaService.mediaContainer.findFirst({
          where: {
            name: newName,
            deletedAt: null,
            id: { not: this.id },
          },
        });

      if (existingContainer) {
        throw new MediaContainerAlreadyExists(newName);
      }
    }

    let collectionsUpdate: Prisma.MediaContainerCollectionUncheckedUpdateManyWithoutContainerNestedInput =
      {};

    let allUpdateIds: string[] = [];

    if (newCollectionIds !== undefined) {
      const currentCollections =
        await this.prismaService.mediaContainerCollection.findMany({
          where: { containerId: this.id },
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
        return await tx.mediaContainer.update({
          where: { id: this.id },
          data: {
            name: newName,
            collections: collectionsUpdate,
          },
          select: selectMediaContainer(),
        });
      });

      this._name = updated.name;
      this._type = updated.type;
      this._status = updated.status as MediaContainerStatus;
      this._createdAt = updated.createdAt;
      this.assets = updated.assets as SelectedMediaContainer['assets'];
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new MediaContainerNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Deletes the media container.
   * @param permanently Whether to permanently delete the media container.
   */
  async delete(permanently = false): Promise<void> {
    try {
      if (permanently) {
        await this.prismaService.mediaContainer.delete({
          where: { id: this.id },
        });
        const provider = await this.storageUnit.getProvider();
        await provider.deleteDirectory(
          getMediaContainerPath(this.id, {
            storageUnitId: this.storageUnit.id,
            prefix: this.pathPrefix,
          })
        );
        await this.eventPublisher.publish('media.container.deleted', {
          containerIds: [this.id],
        });
        return;
      }

      if (this.status === 'DELETED') {
        throw new MediaContainerAlreadyDeleted(this.id);
      }

      const updated = await this.prismaService.mediaContainer.update({
        where: { id: this.id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
        select: selectMediaContainer(),
      });

      this._status = updated.status;
      await this.eventPublisher.publish('media.container.deleted', {
        containerIds: [this.id],
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new MediaContainerNotFound(this.id);
      }
      throw e;
    }
  }

  async toDto(): Promise<MediaContainerDto> {
    const collections =
      await this.prismaService.mediaContainerCollection.findMany({
        where: { containerId: this.id },
        select: {
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return new MediaContainerDto({
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

  async toSummaryDto(): Promise<MediaContainerSummaryDto> {
    return new MediaContainerSummaryDto({
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  /**
   * Builds an embedding-friendly document from this media container.
   * Aggregates container metadata, asset information, and classifier results
   * into a format suitable for generating vector embeddings.
   *
   * @returns The embedding document, or null if the container has no primary asset
   */
  toEmbeddingText(): string {
    const primaryAsset = this.assets.find(
      (asset) => asset.variant === MediaAssetVariant.PRIMARY
    );

    if (primaryAsset?.status !== MediaAssetStatus.READY) {
      throw new MediaContainerNotEmbeddable(this.id);
    }

    const classifierResults = primaryAsset.classifierRuns.reduce((acc, run) => {
      acc[run.classifier.name] = run.result as JsonObject;
      return acc;
    }, {} as Record<string, JsonObject>);

    const dimensions =
      primaryAsset.width && primaryAsset.height
        ? `${primaryAsset.width}x${primaryAsset.height}`
        : undefined;

    const textParts: string[] = [
      `Name: ${this.name}`,
      `MIME Type: ${primaryAsset.mimeType}`,
      dimensions ? `Dimensions: ${dimensions}` : '',
      primaryAsset.size ? `Size: ${formatBytes(primaryAsset.size)}` : '',
      primaryAsset.aspectRatio
        ? `Aspect Ratio: ${primaryAsset.aspectRatio.toFixed(2)}`
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
    return new MediaAssetVariantsDto(
      await Promise.all(
        this.assets.map(async (asset) => await this.hydrateAsset(asset))
      )
    );
  }

  private async hydrateAsset(asset: SelectedMediaContainer['assets'][number]) {
    // Assumes primary as the only variant for now
    const filename = `primary.${mimeTypeToExtension(
      asset.mimeType as SupportedMimeType
    )}`;

    const url = this.urlSigningService.generateSignedUrl(this.id, filename);

    return {
      ...asset,
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
