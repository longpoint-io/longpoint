import { SearchIndexItemStatus } from '@/database';
import { AssetDto, AssetService } from '@/modules/asset';
import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import { ConfigValues } from '@longpoint/config-schema';
import { Logger } from '@nestjs/common';
import { SearchIndexDto } from '../dtos';
import { SearchProviderEntity } from './search-provider.entity';

export interface SearchIndexEntityArgs {
  id: string;
  active: boolean;
  indexing: boolean;
  name: string;
  mediaIndexed: number;
  configFromDb: ConfigValues;
  lastIndexedAt: Date | null;
  searchProvider: SearchProviderEntity;
  assetService: AssetService;
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
  private readonly searchProvider: SearchProviderEntity;
  private readonly assetService: AssetService;
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
    this.searchProvider = args.searchProvider;
    this.assetService = args.assetService;
    this.prismaService = args.prismaService;
  }

  async markAssetsAsStale(assetIds: string[]): Promise<void> {
    await this.prismaService.searchIndexItem.updateMany({
      where: {
        indexId: this.id,
        assetId: { in: assetIds },
      },
      data: {
        status: SearchIndexItemStatus.STALE,
      },
    });
  }

  /**
   * Queries the search index with a text query and returns matching assets.
   * @param queryText The search query text
   * @returns Array of AssetDto matching the query
   */
  async query(queryText: string): Promise<AssetDto[]> {
    const indexConfigValues = await this.getIndexConfigValues();
    const searchResults = await this.searchProvider.embedAndSearch(
      queryText,
      indexConfigValues
    );

    if (searchResults.length === 0) {
      return [];
    }

    const scoreMap = new Map<string, number>(
      searchResults.map((result) => [result.id, result.score])
    );
    const assets = await this.assetService.listAssetsByIds(
      Array.from(scoreMap.keys())
    );
    assets.sort((a, b) => scoreMap.get(b.id)! - scoreMap.get(a.id)!);

    return assets.map((asset) => asset.toDto());
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
      // Step 1: Delete items with null assetId in batches
      await this.deleteNullAssetItems();

      // Step 2: Find assets that need indexing (new ones and stale ones)
      const newAssets = await this.prismaService.asset.findMany({
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
          assetId: { not: null },
        },
        select: {
          assetId: true,
        },
      });

      const staleAssetIds = staleItems
        .map((item) => item.assetId)
        .filter((id): id is string => id !== null);

      const assetsToIndex = [...newAssets.map((a) => a.id), ...staleAssetIds];

      if (assetsToIndex.length === 0) {
        this.logger.log('No assets to index');
      } else {
        this.logger.log(
          `Indexing ${assetsToIndex.length} assets in batches (${newAssets.length} new, ${staleAssetIds.length} stale)`
        );
        await this.indexAssetsBatch(assetsToIndex);
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
      await this.searchProvider.dropIndex(indexConfigValues);
    } catch (error) {
      this.logger.warn(
        `Failed to delete index from search provider: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      // Continue with database cleanup even if search provider deletion fails
    }

    await this.prismaService.searchIndex.delete({
      where: { id: this.id },
    });
  }

  /**
   * Deletes items with null assetId in batches.
   * @param batchSize Number of items to process per batch (default: 50)
   */
  private async deleteNullAssetItems(batchSize = 50): Promise<void> {
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const nullItems = await this.prismaService.searchIndexItem.findMany({
        where: {
          indexId: this.id,
          assetId: null,
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
        `Deleting batch of ${externalIds.length} external IDs with null assetId`
      );

      // Delete from vector store first, then from database
      try {
        const indexConfigValues = await this.getIndexConfigValues();
        await this.searchProvider.delete(externalIds, indexConfigValues);
      } catch (error) {
        this.logger.warn(
          `Failed to delete null items from search provider: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        // Continue with database cleanup even if search provider deletion fails
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
   * Indexes multiple assets in batches for better scalability.
   * @param assetIds Array of asset IDs to index
   * @param batchSize Number of assets to process per batch (default: 50)
   */
  private async indexAssetsBatch(
    assetIds: string[],
    batchSize = 50
  ): Promise<void> {
    for (let i = 0; i < assetIds.length; i += batchSize) {
      const batch = assetIds.slice(i, i + batchSize);
      this.logger.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          assetIds.length / batchSize
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
   * Processes a batch of assets by fetching them, generating embeddings, and upserting.
   * @param assetIds Array of asset IDs to process
   */
  private async processBatch(assetIds: string[]): Promise<void> {
    // Mark new items as INDEXING
    await this.prismaService.searchIndexItem.createMany({
      data: assetIds.map((assetId) => ({
        indexId: this.id,
        assetId,
        status: SearchIndexItemStatus.INDEXING,
        externalId: assetId,
      })),
      skipDuplicates: true,
    });

    // Update existing items (including STALE ones) to INDEXING status
    await this.prismaService.searchIndexItem.updateMany({
      where: {
        indexId: this.id,
        assetId: { in: assetIds },
      },
      data: {
        status: SearchIndexItemStatus.INDEXING,
      },
    });

    const assets = await this.assetService.listAssetsByIds(assetIds);

    // Considered stale items if their assets do not exist
    const foundAssetIds = new Set(assets.map((a) => a.id));
    const missingAssetIds = assetIds.filter((id) => !foundAssetIds.has(id));
    if (missingAssetIds.length > 0) {
      const missingItems = await this.prismaService.searchIndexItem.findMany({
        where: {
          indexId: this.id,
          assetId: { in: missingAssetIds },
        },
        select: {
          id: true,
        },
      });
      const missingItemIds = missingItems.map((item) => item.id);

      if (missingItemIds.length > 0) {
        try {
          const indexConfigValues = await this.getIndexConfigValues();
          await this.searchProvider.delete(missingItemIds, indexConfigValues);
        } catch (error) {
          this.logger.warn(
            `Failed to delete missing containers from search provider: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
          // Continue with database cleanup even if search provider deletion fails
        }
      }

      await this.prismaService.searchIndexItem.deleteMany({
        where: {
          indexId: this.id,
          assetId: { in: missingAssetIds },
        },
      });
    }

    if (assets.length === 0) {
      return;
    }

    // Get the search index item IDs for the found assets
    const indexItems = await this.prismaService.searchIndexItem.findMany({
      where: {
        indexId: this.id,
        assetId: { in: Array.from(foundAssetIds) },
      },
      select: {
        id: true,
        externalId: true,
        assetId: true,
      },
    });

    // Create a map from asset ID to search index item external ID
    const assetIdToItemId = new Map(
      indexItems.map((item) => [item.assetId, item.externalId])
    );

    try {
      const documents = assets.map((asset) => {
        const externalId = assetIdToItemId.get(asset.id);
        if (!externalId) {
          throw new Error(
            `Search index item external ID not found for asset ${asset.id}`
          );
        }
        return {
          id: externalId, // Use search index item external ID as the vector document ID
          text: asset.toEmbeddingText(),
        };
      });

      // if (!this.embeddingModel) {
      const indexConfigValues = await this.getIndexConfigValues();
      await this.searchProvider.embedAndUpsert(documents, indexConfigValues);
      // } else {
      // TODO: Handle after embedding model is implemented
      // }

      // Only update items for assets that were actually found
      await this.prismaService.searchIndexItem.updateMany({
        where: {
          indexId: this.id,
          assetId: { in: Array.from(foundAssetIds) },
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
          await this.searchProvider.delete(
            externalIdsToDelete,
            indexConfigValues
          );
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete external IDs from search provider during error cleanup: ${
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
          assetId: { in: Array.from(foundAssetIds) },
        },
      });
      throw error;
    }
  }

  async toDto(): Promise<SearchIndexDto> {
    const indexConfigValues = await this.getIndexConfigValues();
    return new SearchIndexDto({
      id: this.id,
      active: this._active,
      indexing: this._indexing,
      name: this._name,
      config: this._configFromDb
        ? await this.searchProvider.processIndexConfigFromDb(this._configFromDb)
        : null,
      searchProvider: this.searchProvider.toReferenceDto(),
      assetsIndexed: this._mediaIndexed,
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
    return await this.searchProvider.processIndexConfigFromDb(
      this._configFromDb
    );
  }
}
