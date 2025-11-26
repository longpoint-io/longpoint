import { Prisma } from '@/database';
import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import { MediaContainerService } from '@/modules/media';
import { ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { CreateSearchIndexDto } from '../dtos';
import { SearchIndexEntity } from '../entities';
import {
  NativeEmbeddingNotSupported,
  SearchIndexNotFound,
} from '../search.errors';
import { SelectedSearchIndex, selectSearchIndex } from '../search.selectors';
import { VectorProviderService } from './vector-provider.service';

@Injectable()
export class SearchIndexService {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly vectorProviderService: VectorProviderService,
    private readonly mediaContainerService: MediaContainerService,
    private readonly configSchemaService: ConfigSchemaService
  ) {}

  async createIndex(data: CreateSearchIndexDto) {
    const indexConfigForDb =
      await this.vectorProviderService.processIndexConfigForDb(
        data.vectorProviderId,
        data.config ?? {}
      );
    const vectorProvider =
      await this.vectorProviderService.getProviderByIdOrThrow(
        data.vectorProviderId
      );

    let embeddingModelId = data.embeddingModelId;

    if (!embeddingModelId && !vectorProvider.supportsEmbedding) {
      throw new NativeEmbeddingNotSupported(vectorProvider.id);
    }

    if (embeddingModelId) {
      // TODO: Handle custom embedding model
      throw new Error('Custom embedding model not yet supported');
    }

    let index = await this.prismaService.searchIndex.create({
      data: {
        name: data.name,
        vectorProviderId: vectorProvider.id,
        embeddingModelId,
        config: indexConfigForDb,
      },
      select: selectSearchIndex(),
    });

    if (data.active) {
      index = await this.makeActiveIndex(index.id);
    }

    return new SearchIndexEntity({
      id: index.id,
      active: index.active,
      indexing: index.indexing,
      name: index.name,
      lastIndexedAt: index.lastIndexedAt,
      mediaIndexed: index.mediaIndexed,
      vectorProvider,
      embeddingModel: null,
      mediaContainerService: this.mediaContainerService,
      prismaService: this.prismaService,
      configFromDb: index.config as ConfigValues,
      configSchemaService: this.configSchemaService,
    });
  }

  async listIndexes(): Promise<SearchIndexEntity[]> {
    const indexes = await this.prismaService.searchIndex.findMany({
      select: selectSearchIndex(),
      orderBy: [{ active: 'desc' }, { lastIndexedAt: 'desc' }],
    });

    const indexEntities: SearchIndexEntity[] = [];

    for (const index of indexes) {
      const vectorProvider =
        await this.vectorProviderService.getProviderBySearchIndexIdOrThrow(
          index.id
        );
      indexEntities.push(
        new SearchIndexEntity({
          id: index.id,
          active: index.active,
          indexing: index.indexing,
          name: index.name,
          lastIndexedAt: index.lastIndexedAt,
          mediaIndexed: index.mediaIndexed,
          vectorProvider,
          embeddingModel: null,
          mediaContainerService: this.mediaContainerService,
          prismaService: this.prismaService,
          configFromDb: index.config as ConfigValues,
          configSchemaService: this.configSchemaService,
        })
      );
    }

    return indexEntities;
  }

  async getIndexById(indexId: string): Promise<SearchIndexEntity | null> {
    const index = await this.prismaService.searchIndex.findUnique({
      where: { id: indexId },
      select: selectSearchIndex(),
    });

    if (!index) {
      return null;
    }

    const vectorProvider =
      await this.vectorProviderService.getProviderBySearchIndexIdOrThrow(
        index.id
      );

    return new SearchIndexEntity({
      id: index.id,
      active: index.active,
      indexing: index.indexing,
      name: index.name,
      lastIndexedAt: index.lastIndexedAt,
      mediaIndexed: index.mediaIndexed,
      vectorProvider,
      embeddingModel: null,
      mediaContainerService: this.mediaContainerService,
      prismaService: this.prismaService,
      configFromDb: index.config as ConfigValues,
      configSchemaService: this.configSchemaService,
    });
  }

  async getIndexByIdOrThrow(id: string): Promise<SearchIndexEntity> {
    const index = await this.getIndexById(id);
    if (!index) {
      throw new SearchIndexNotFound(id);
    }
    return index;
  }

  async getActiveIndex(): Promise<SearchIndexEntity | null> {
    const index = await this.prismaService.searchIndex.findFirst({
      where: {
        active: true,
      },
      select: selectSearchIndex(),
    });

    if (!index) {
      return null;
    }

    const vectorProvider =
      await this.vectorProviderService.getProviderBySearchIndexIdOrThrow(
        index.id
      );

    return new SearchIndexEntity({
      id: index.id,
      active: index.active,
      indexing: index.indexing,
      name: index.name,
      lastIndexedAt: index.lastIndexedAt,
      mediaIndexed: index.mediaIndexed,
      vectorProvider,
      embeddingModel: null,
      mediaContainerService: this.mediaContainerService,
      prismaService: this.prismaService,
      configFromDb: index.config as ConfigValues,
      configSchemaService: this.configSchemaService,
    });
  }

  private async makeActiveIndex(
    indexId: string,
    tx?: Prisma.TransactionClient
  ) {
    const activate = async (tx: Prisma.TransactionClient) => {
      await tx.searchIndex.updateMany({
        where: {
          active: true,
        },
        data: {
          active: false,
        },
      });

      return tx.searchIndex.update({
        where: {
          id: indexId,
        },
        data: {
          active: true,
        },
        select: selectSearchIndex(),
      });
    };

    let updatedIndex: SelectedSearchIndex;

    if (tx) {
      updatedIndex = await activate(tx);
    } else {
      updatedIndex = await this.prismaService.$transaction(activate);
    }

    // Trigger background sync after activation
    this.getActiveIndex()
      .then((index) => {
        if (index) {
          index.sync().catch((error) => {
            this.logger.error(
              `Failed to sync index ${index.id} after activation: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          });
        }
      })
      .catch((error) => {
        this.logger.error(
          `Failed to get active index after activation: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      });

    return updatedIndex;
  }
}
