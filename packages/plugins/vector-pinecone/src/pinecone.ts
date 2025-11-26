import { ConfigValues } from '@longpoint/config-schema';
import {
  EmbedAndUpsertDocument,
  SearchResult,
  VectorDocument,
  VectorMetadata,
  VectorProvider,
  VectorProviderArgs,
} from '@longpoint/devkit';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconePluginSettings } from './settings.js';

export class PineconeVectorProvider extends VectorProvider<PineconePluginSettings> {
  constructor(args: VectorProviderArgs<PineconePluginSettings>) {
    super({
      pluginSettings: args.pluginSettings,
    });
  }

  async upsert(
    documents: VectorDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    await this.client.index(indexConfigValues.name).upsert(
      documents.map((d) => ({
        id: d.id,
        values: d.embedding,
        metadata: d.metadata,
      }))
    );
  }

  override async embedAndUpsert(
    documents: EmbedAndUpsertDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    await this.client.index(indexConfigValues.name).upsertRecords(
      documents.map((d) => ({
        id: d.id,
        text: d.text,
        ...(d.metadata ? d.metadata : {}),
      }))
    );
  }

  async delete(
    documentIds: string[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    await this.client.index(indexConfigValues.name).deleteMany(documentIds);
  }

  async dropIndex(indexConfigValues: ConfigValues): Promise<void> {
    await this.client.index(indexConfigValues.name).deleteAll();
  }

  async search(
    queryVector: number[],
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    const limit = indexConfigValues.limit ?? 10;
    const result = await this.client.index(indexConfigValues.name).query({
      vector: queryVector,
      topK: limit,
    });
    return result.matches.map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata as VectorMetadata,
    }));
  }

  override async embedAndSearch(
    queryText: string,
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    const limit = indexConfigValues.limit ?? 10;
    const result = await this.client
      .index(indexConfigValues.name)
      .searchRecords({
        query: {
          topK: limit,
          inputs: { text: queryText },
        },
        // rerank: {
        //   model: 'bge-reranker-v2-m3',
        //   rankFields: ['chunk_text'],
        //   topN: limit,
        // },
      });
    return result.result.hits.map((h) => {
      const { _id, _score, fields } = h;
      return {
        id: _id,
        score: _score ?? 0,
        metadata: fields as VectorMetadata,
      };
    });
  }

  private get client(): Pinecone {
    return new Pinecone({
      apiKey: this.pluginSettings.apiKey,
    });
  }
}
