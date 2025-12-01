import {
  selectCollection,
  SelectedCollection,
} from '@/shared/selectors/collection.selectors';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import {
  CollectionDetailsDto,
  CollectionDto,
  UpdateCollectionDto,
} from '../dtos';
import { CollectionAlreadyExists, CollectionNotFound } from '../media.errors';

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

  /**
   * Remove one or more media containers from the collection.
   * @param containerIds - The unique identifiers of the media containers to remove
   */
  async removeMediaContainers(containerIds: string[]): Promise<void> {
    await this.prismaService.mediaContainerCollection.deleteMany({
      where: {
        collectionId: this.id,
        containerId: { in: containerIds },
      },
    });
  }

  toDto(): CollectionDto {
    return new CollectionDto({
      id: this.id,
      name: this._name,
      mediaContainerCount: this._count.containers,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  toDetailsDto(): CollectionDetailsDto {
    return new CollectionDetailsDto({
      id: this.id,
      name: this._name,
      description: this._description,
      mediaContainerCount: this._count.containers,
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
