import { BaseError } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { EventPublisher } from '../event';
import {
  CollectionAlreadyExists,
  CollectionNotFound,
} from './collection.errors';
import { selectCollection, SelectedCollection } from './collection.selectors';
import {
  CollectionDetailsDto,
  CollectionDto,
  UpdateCollectionDto,
} from './dtos';

export interface CollectionEntityArgs extends SelectedCollection {
  prismaService: PrismaService;
  eventPublisher: EventPublisher;
}

export class CollectionEntity {
  public readonly id: string;
  private _name: string;
  private _description: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private readonly prismaService: PrismaService;
  private _count: SelectedCollection['_count'];

  constructor(args: CollectionEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._description = args.description;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.prismaService = args.prismaService;
    this._count = args._count;
  }

  async update(data: UpdateCollectionDto) {
    const { name: newName, description: newDescription } = data;

    if (newName !== undefined && newName !== this._name) {
      const existingCollection = await this.prismaService.collection.findFirst({
        where: {
          name: newName,
          id: { not: this.id },
        },
      });

      if (existingCollection) {
        throw new CollectionAlreadyExists(newName);
      }
    }

    try {
      const updated = await this.prismaService.collection.update({
        where: { id: this.id },
        data: {
          name: newName,
          description: newDescription,
        },
        select: selectCollection(),
      });

      this._name = updated.name;
      this._description = updated.description;
      this._updatedAt = updated.updatedAt;
      this._count = updated._count;
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new CollectionNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Deletes the collection
   */
  async delete(): Promise<void> {
    try {
      await this.prismaService.collection.delete({
        where: { id: this.id },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new CollectionNotFound(this.id);
      }
      throw e;
    }
  }

  async addAssets(assetIds: string[]): Promise<void> {
    const existingAssets = await this.prismaService.assetCollection.findMany({
      where: {
        collectionId: this.id,
        assetId: { in: assetIds },
      },
    });
    const existingAssetIds = new Set(existingAssets.map((a) => a.assetId));
    const newAssetIds = assetIds.filter((id) => !existingAssetIds.has(id));
    if (newAssetIds.length > 0) {
      try {
        await this.prismaService.assetCollection.createMany({
          data: newAssetIds.map((id) => ({
            collectionId: this.id,
            assetId: id,
          })),
        });
      } catch (e) {
        if (PrismaService.isNotFoundError(e)) {
          throw new BaseError(
            ErrorCode.RESOURCE_NOT_FOUND,
            'One or more assets were not found',
            HttpStatus.NOT_FOUND
          );
        }
        throw e;
      }
      this._count.assets = await this.prismaService.assetCollection.count({
        where: {
          collectionId: this.id,
        },
      });
    }
  }

  /**
   * Remove one or more assets from the collection.
   * @param assetIds - The unique identifiers of the assets to remove
   */
  async removeAssets(assetIds: string[]): Promise<void> {
    await this.prismaService.assetCollection.deleteMany({
      where: {
        collectionId: this.id,
        assetId: { in: assetIds },
      },
    });
    this._count.assets = await this.prismaService.assetCollection.count({
      where: {
        collectionId: this.id,
      },
    });
  }

  toDto(): CollectionDto {
    return new CollectionDto({
      id: this.id,
      name: this._name,
      assetCount: this._count.assets,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  toDetailsDto(): CollectionDetailsDto {
    return new CollectionDetailsDto({
      id: this.id,
      name: this._name,
      description: this._description,
      assetCount: this._count.assets,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }
}
