import { selectCollection } from '@/shared/selectors/collection.selectors';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { CreateCollectionDto, ListCollectionsQueryDto } from '../dtos';
import { CollectionEntity } from '../entities/collection.entity';
import { CollectionAlreadyExists, CollectionNotFound } from '../media.errors';
import { MediaContainerService } from './media-container.service';

/**
 * Service for managing collections and their relationships with media containers.
 * Handles creation, retrieval, listing, and hierarchy management of collections.
 */
@Injectable()
export class CollectionService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => MediaContainerService))
    private readonly mediaContainerService: MediaContainerService,
    private readonly eventPublisher: EventPublisher
  ) {}

  /**
   * Creates a new collection.
   *
   * @param data - Parameters for creating the collection
   * @param data.name - The name of the collection
   * @param data.description - Optional description
   * @param data.parentId - Optional parent collection ID for hierarchical organization
   *
   * @returns The created CollectionEntity instance
   */
  async createCollection(data: CreateCollectionDto): Promise<CollectionEntity> {
    const existingCollection = await this.prismaService.collection.findFirst({
      where: {
        name: {
          mode: 'insensitive',
          equals: data.name,
        },
      },
    });

    if (existingCollection) {
      throw new CollectionAlreadyExists(data.name);
    }

    const collection = await this.prismaService.collection.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
      select: selectCollection(),
    });

    return new CollectionEntity({
      ...collection,
      prismaService: this.prismaService,
      eventPublisher: this.eventPublisher,
    });
  }

  /**
   * Retrieves a collection by its unique identifier.
   *
   * @param id - The unique identifier of the collection
   *
   * @returns The CollectionEntity instance or null if not found
   */
  async getCollectionById(id: string): Promise<CollectionEntity | null> {
    const collection = await this.prismaService.collection.findUnique({
      where: { id },
      select: selectCollection(),
    });

    if (!collection) {
      return null;
    }

    return new CollectionEntity({
      ...collection,
      prismaService: this.prismaService,
      eventPublisher: this.eventPublisher,
    });
  }

  /**
   * Retrieves a collection by its unique identifier, throwing an error if not found.
   *
   * @param id - The unique identifier of the collection
   *
   * @returns The CollectionEntity instance (guaranteed to be non-null)
   *
   * @throws {CollectionNotFound} If the collection does not exist
   */
  async getCollectionByIdOrThrow(id: string): Promise<CollectionEntity> {
    const collection = await this.getCollectionById(id);
    if (!collection) {
      throw new CollectionNotFound(id);
    }
    return collection;
  }

  /**
   * Lists collections with optional filtering and pagination.
   *
   * @param query - Optional query parameters for filtering and pagination
   *
   * @returns An array of CollectionEntity instances
   */
  async listCollections(
    query?: ListCollectionsQueryDto
  ): Promise<CollectionEntity[]> {
    const paginationOptions = query?.toPrisma() ?? {
      take: 100,
      skip: 0,
      cursor: undefined,
      orderBy: { id: 'desc' },
    };

    const collections = await this.prismaService.collection.findMany({
      select: selectCollection(),
      ...paginationOptions,
    });

    return collections.map(
      (collection) =>
        new CollectionEntity({
          ...collection,
          prismaService: this.prismaService,
          eventPublisher: this.eventPublisher,
        })
    );
  }

  /**
   * Lists all collections that contain a specific container.
   *
   * @param containerId - The ID of the container
   *
   * @returns An array of CollectionEntity instances
   */
  async listCollectionsByContainerId(
    containerId: string
  ): Promise<CollectionEntity[]> {
    const associations =
      await this.prismaService.mediaContainerCollection.findMany({
        where: { containerId },
        select: {
          collection: {
            select: selectCollection(),
          },
        },
      });

    return associations.map(
      (assoc) =>
        new CollectionEntity({
          ...assoc.collection,
          prismaService: this.prismaService,
          eventPublisher: this.eventPublisher,
        })
    );
  }

  /**
   * Lists all containers in a specific collection.
   *
   * @param collectionId - The ID of the collection
   *
   * @returns An array of MediaContainerEntity instances
   */
  async listContainersByCollectionId(collectionId: string) {
    const associations =
      await this.prismaService.mediaContainerCollection.findMany({
        where: { collectionId },
        select: { containerId: true },
      });

    const containerIds = associations.map((assoc) => assoc.containerId);

    if (containerIds.length === 0) {
      return [];
    }

    return this.mediaContainerService.listContainersByIds(containerIds);
  }
}
