import { ConfigValues } from '@longpoint/config-schema';
import {
  DocumentMetadata,
  SearchArgs,
  SearchDocument,
  SearchProvider,
  SearchProviderArgs,
  SearchResult,
} from '@longpoint/devkit';
import {
  IntegratedRecord,
  Pinecone,
  PineconeRecord,
  RecordMetadata,
  RecordMetadataValue,
} from '@pinecone-database/pinecone';
import { PineconePluginSettings } from './settings.js';

export class PineconeSearchProvider extends SearchProvider<PineconePluginSettings> {
  constructor(args: SearchProviderArgs<PineconePluginSettings>) {
    super({
      pluginSettings: args.pluginSettings,
    });
  }

  async upsert(
    documents: SearchDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const embeddingDocuments: PineconeRecord[] = [];
    const textDocuments: IntegratedRecord[] = [];

    for (const d of documents) {
      if (typeof d.textOrEmbedding === 'string') {
        textDocuments.push({
          id: d.id,
          text: d.textOrEmbedding,
          ...(d.metadata ? this.normalizeMetadata(d.metadata) : {}),
        });
      } else {
        embeddingDocuments.push({
          id: d.id,
          values: d.textOrEmbedding,
          metadata: d.metadata ? this.normalizeMetadata(d.metadata) : undefined,
        });
      }
    }

    const index = this.client.index(indexConfigValues.name);

    if (embeddingDocuments.length > 0) {
      await index.upsert(embeddingDocuments);
    }

    if (textDocuments.length > 0) {
      await index.upsertRecords(textDocuments);
    }
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
    args: SearchArgs,
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    const index = this.client.index(indexConfigValues.name);

    if (typeof args.query === 'string') {
      const result = await index.searchRecords({
        query: {
          topK: args.pageSize ?? 10,
          inputs: { text: args.query },
          filter: args.filter,
        },
      });
      return result.result.hits.map((h) => ({
        id: h._id,
        score: h._score ?? 0,
        metadata: h.fields as DocumentMetadata,
      }));
    }

    const result = await index.query({
      vector: args.query,
      topK: args.pageSize ?? 10,
      filter: args.filter,
    });

    return result.matches.map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata as DocumentMetadata,
    }));
  }

  /**
   * Normalize the metadata to a format that can be used by Pinecone.
   * @param metadata The metadata to normalize.
   * @returns The normalized metadata.
   * @see https://docs.pinecone.io/guides/index-data/indexing-overview#metadata-format
   */
  private normalizeMetadata(metadata: DocumentMetadata): RecordMetadata {
    const normalized: RecordMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
      let normalizedValue = value;
      if (Array.isArray(value) && !value.every((v) => typeof v === 'string')) {
        normalizedValue = value.map((v) => v.toString());
      } else if (typeof value === 'object' && value !== null) {
        normalizedValue = JSON.stringify(value);
      } else if (value === null) {
        continue;
      }
      normalized[key] = normalizedValue as RecordMetadataValue;
    }
    return normalized;
  }

  private get client(): Pinecone {
    return new Pinecone({
      apiKey: this.pluginSettings.apiKey,
    });
  }
}
