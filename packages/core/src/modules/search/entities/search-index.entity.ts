import { SearchIndexItemStatus } from '@/database';
import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import { MediaContainerService } from '@/modules/media';
import { MediaContainerSummaryDto } from '@/modules/media/dtos/containers/media-container-summary.dto';
import { ConfigValues } from '@longpoint/config-schema';
import { Logger } from '@nestjs/common';
import { SearchIndexDto } from '../dtos';
import { VectorProviderEntity } from './vector-provider.entity';

export interface SearchIndexEntityArgs {
  id: string;
  active: boolean;
  indexing: boolean;
  name: string;
  mediaIndexed: number;
  configFromDb: ConfigValues;
  lastIndexedAt: Date | null;
  vectorProvider: VectorProviderEntity;
  mediaContainerService: MediaContainerService;
  prismaService: PrismaService;
  configSchemaService: ConfigSchemaService;
}

export class SearchIndexEntity {
  readonly id: string;
  private _active: boolean;
  private _indexing: boolean;
  private _name: string;
  private _mediaIndexed: number;
  private _lastIndexedAt: Date | null;
  private _configFromDb: ConfigValues;
  private readonly vectorProvider: VectorProviderEntity;
  private readonly mediaContainerService: MediaContainerService;
  private readonly prismaService: PrismaService;
  private readonly logger = new Logger(SearchIndexEntity.name);

  constructor(args: SearchIndexEntityArgs) {
    this.id = args.id;
    this._active = args.active;
    this._indexing = args.indexing;
    this._name = args.name;
    this._mediaIndexed = args.mediaIndexed;
    this._configFromDb = args.configFromDb;
    this._lastIndexedAt = args.lastIndexedAt;
    this.vectorProvider = args.vectorProvider;
    this.mediaContainerService = args.mediaContainerService;
    this.prismaService = args.prismaService;
  }

  async markContainersAsStale(containerIds: string[]): Promise<void> {
    await this.prismaService.searchIndexItem.updateMany({
      where: {
        indexId: this.id,
        mediaContainerId: { in: containerIds },
      },
      data: {
        status: SearchIndexItemStatus.STALE,
      },
    });
  }

  /**
   * Queries the search index with a text query and returns matching media containers.
   * @param queryText The search query text
   * @returns Array of MediaContainerSummaryDto matching the query
   */
  async query(queryText: string): Promise<MediaContainerSummaryDto[]> {
    const indexConfigValues = await this.getIndexConfigValues();
    const searchResults = await this.vectorProvider.embedAndSearch(
      queryText,
      indexConfigValues
    );

    if (searchResults.length === 0) {
      return [];
    }

    const scoreMap = new Map<string, number>(
      searchResults.map((result) => [result.id, result.score])
    );
    const containers = await this.mediaContainerService.listContainersByIds(
      Array.from(scoreMap.keys())
    );
    containers.sort((a, b) => scoreMap.get(b.id)! - scoreMap.get(a.id)!);

    const summaryDtos = await Promise.all(
      containers.map((container) => container.toSummaryDto())
    );

    return summaryDtos;
  }

  async sync(): Promise<void> {
    const currentIndex = await this.prismaService.searchIndex.findUnique({
      where: { id: this.id },
      select: { indexing: true },
    });

    if (currentIndex?.indexing) {
      return;
    }

    await this.prismaService.searchIndex.update({
      where: { id: this.id },
      data: { indexing: true },
    });

    try {
      // Step 1: Delete items with null mediaContainerId in batches
      await this.deleteNullContainerItems();

      // Step 2: Find containers that need indexing (new ones and stale ones)
      const newContainers = await this.prismaService.mediaContainer.findMany({
        where: {
          status: 'READY',
          deletedAt: null,
          searchIndexItems: {
            none: {
              indexId: this.id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      const staleItems = await this.prismaService.searchIndexItem.findMany({
        where: {
          indexId: this.id,
          status: SearchIndexItemStatus.STALE,
          mediaContainerId: { not: null },
        },
        select: {
          mediaContainerId: true,
        },
      });

      const staleContainerIds = staleItems
        .map((item) => item.mediaContainerId)
        .filter((id): id is string => id !== null);

      const containersToIndex = [
        ...newContainers.map((c) => c.id),
        ...staleContainerIds,
      ];

      if (containersToIndex.length === 0) {
        this.logger.log('No containers to index');
      } else {
        this.logger.log(
          `Indexing ${containersToIndex.length} containers in batches (${newContainers.length} new, ${staleContainerIds.length} stale)`
        );
        await this.indexContainersBatch(containersToIndex);
      }

      const totalIndexed = await this.prismaService.searchIndexItem.count({
        where: {
          indexId: this.id,
          status: 'INDEXED',
        },
      });

      const updatedIndex = await this.prismaService.searchIndex.update({
        where: { id: this.id },
        data: {
          indexing: false,
          lastIndexedAt: new Date(),
          mediaIndexed: totalIndexed,
        },
      });

      this._lastIndexedAt = updatedIndex.lastIndexedAt;
      this._mediaIndexed = updatedIndex.mediaIndexed;
      this._indexing = updatedIndex.indexing;
    } catch (error) {
      // Ensure indexing flag is cleared even on error
      await this.prismaService.searchIndex.update({
        where: { id: this.id },
        data: { indexing: false },
      });
      throw error;
    }
  }

  /**
   * Deletes the search index from the database and the vector provider.
   */
  async delete(): Promise<void> {
    try {
      const indexConfigValues = await this.getIndexConfigValues();
      await this.vectorProvider.dropIndex(indexConfigValues);
    } catch (error) {
      this.logger.warn(
        `Failed to delete index from vector store: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Continue with database cleanup even if vector provider deletion fails
    }

    await this.prismaService.searchIndex.delete({
      where: { id: this.id },
    });
  }

  /**
   * Deletes items with null mediaContainerId in batches.
   * @param batchSize Number of items to process per batch (default: 50)
   */
  private async deleteNullContainerItems(batchSize = 50): Promise<void> {
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const nullItems = await this.prismaService.searchIndexItem.findMany({
        where: {
          indexId: this.id,
          mediaContainerId: null,
        },
        select: {
          externalId: true,
        },
        take: batchSize,
        skip: offset,
      });

      if (nullItems.length === 0) {
        hasMore = false;
        break;
      }

      const externalIds = nullItems.map((item) => item.externalId);
      this.logger.log(
        `Deleting batch of ${externalIds.length} external IDs with null mediaContainerId`
      );

      // Delete from vector store first, then from database
      try {
        const indexConfigValues = await this.getIndexConfigValues();
        await this.vectorProvider.delete(externalIds, indexConfigValues);
      } catch (error) {
        this.logger.warn(
          `Failed to delete null items from vector store: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        // Continue with database cleanup even if vector provider deletion fails
      }

      await this.prismaService.searchIndexItem.deleteMany({
        where: {
          externalId: { in: externalIds },
        },
      });

      offset += batchSize;
      hasMore = nullItems.length === batchSize;
    }
  }

  /**
   * Indexes multiple containers in batches for better scalability.
   * @param containerIds Array of media container IDs to index
   * @param batchSize Number of containers to process per batch (default: 50)
   */
  private async indexContainersBatch(
    containerIds: string[],
    batchSize = 50
  ): Promise<void> {
    for (let i = 0; i < containerIds.length; i += batchSize) {
      const batch = containerIds.slice(i, i + batchSize);
      this.logger.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          containerIds.length / batchSize
        )} (${batch.length} containers)`
      );

      try {
        await this.processBatch(batch);
      } catch (error) {
        this.logger.error(
          `Failed to process batch: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }

  /**
   * Processes a batch of containers by fetching them, generating embeddings, and upserting.
   * @param containerIds Array of media container IDs to process
   */
  private async processBatch(containerIds: string[]): Promise<void> {
    // Mark new items as INDEXING
    await this.prismaService.searchIndexItem.createMany({
      data: containerIds.map((mediaContainerId) => ({
        indexId: this.id,
        mediaContainerId,
        status: SearchIndexItemStatus.INDEXING,
        externalId: mediaContainerId,
      })),
      skipDuplicates: true,
    });

    // Update existing items (including STALE ones) to INDEXING status
    await this.prismaService.searchIndexItem.updateMany({
      where: {
        indexId: this.id,
        mediaContainerId: { in: containerIds },
      },
      data: {
        status: SearchIndexItemStatus.INDEXING,
      },
    });

    const containers = await this.mediaContainerService.listContainersByIds(
      containerIds
    );

    // Considered stale items if their containers do not exist
    const foundContainerIds = new Set(containers.map((c) => c.id));
    const missingContainerIds = containerIds.filter(
      (id) => !foundContainerIds.has(id)
    );
    if (missingContainerIds.length > 0) {
      const missingItems = await this.prismaService.searchIndexItem.findMany({
        where: {
          indexId: this.id,
          mediaContainerId: { in: missingContainerIds },
        },
        select: {
          id: true,
        },
      });
      const missingItemIds = missingItems.map((item) => item.id);

      if (missingItemIds.length > 0) {
        try {
          const indexConfigValues = await this.getIndexConfigValues();
          await this.vectorProvider.delete(missingItemIds, indexConfigValues);
        } catch (error) {
          this.logger.warn(
            `Failed to delete missing containers from vector store: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
          // Continue with database cleanup even if vector provider deletion fails
        }
      }

      await this.prismaService.searchIndexItem.deleteMany({
        where: {
          indexId: this.id,
          mediaContainerId: { in: missingContainerIds },
        },
      });
    }

    if (containers.length === 0) {
      return;
    }

    // Get the search index item IDs for the found containers
    const indexItems = await this.prismaService.searchIndexItem.findMany({
      where: {
        indexId: this.id,
        mediaContainerId: { in: Array.from(foundContainerIds) },
      },
      select: {
        id: true,
        externalId: true,
        mediaContainerId: true,
      },
    });

    // Create a map from media container ID to search index item external ID
    const containerIdToItemId = new Map(
      indexItems.map((item) => [item.mediaContainerId, item.externalId])
    );

    try {
      const documents = containers.map((container) => {
        const externalId = containerIdToItemId.get(container.id);
        if (!externalId) {
          throw new Error(
            `Search index item external ID not found for container ${container.id}`
          );
        }
        return {
          id: externalId, // Use search index item external ID as the vector document ID
          text: container.toEmbeddingText(),
        };
      });

      // if (!this.embeddingModel) {
      const indexConfigValues = await this.getIndexConfigValues();
      await this.vectorProvider.embedAndUpsert(documents, indexConfigValues);
      // } else {
      // TODO: Handle after embedding model is implemented
      // }

      // Only update items for containers that were actually found
      await this.prismaService.searchIndexItem.updateMany({
        where: {
          indexId: this.id,
          mediaContainerId: { in: Array.from(foundContainerIds) },
        },
        data: {
          status: SearchIndexItemStatus.INDEXED,
        },
      });
    } catch (error) {
      // Get item IDs for cleanup
      const externalIdsToDelete = indexItems.map((item) => item.externalId);

      // Delete from vector store first
      if (externalIdsToDelete.length > 0) {
        try {
          const indexConfigValues = await this.getIndexConfigValues();
          await this.vectorProvider.delete(
            externalIdsToDelete,
            indexConfigValues
          );
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete external IDs from vector store during error cleanup: ${
              deleteError instanceof Error
                ? deleteError.message
                : 'Unknown error'
            }`
          );
        }
      }

      // Then delete from database
      await this.prismaService.searchIndexItem.deleteMany({
        where: {
          indexId: this.id,
          mediaContainerId: { in: Array.from(foundContainerIds) },
        },
      });
      throw error;
    }
  }

  async toDto(): Promise<SearchIndexDto> {
    return new SearchIndexDto({
      id: this.id,
      active: this._active,
      indexing: this._indexing,
      name: this._name,
      config: this._configFromDb
        ? await this.vectorProvider.processIndexConfigFromDb(this._configFromDb)
        : null,
      vectorProvider: this.vectorProvider.toShortDto(),
      mediaIndexed: this._mediaIndexed,
      lastIndexedAt: this._lastIndexedAt,
    });
  }

  get active(): boolean {
    return this._active;
  }

  get indexing(): boolean {
    return this._indexing;
  }

  get mediaIndexed(): number {
    return this._mediaIndexed;
  }

  get lastIndexedAt(): Date | null {
    return this._lastIndexedAt;
  }

  get name(): string {
    return this._name;
  }

  private async getIndexConfigValues(): Promise<ConfigValues> {
    return await this.vectorProvider.processIndexConfigFromDb(
      this._configFromDb
    );
  }
}
