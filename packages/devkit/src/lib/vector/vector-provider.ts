import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import {
  EmbedAndUpsertDocument,
  SearchResult,
  VectorDocument,
} from './types.js';

export interface VectorProviderArgs<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  pluginSettings: ConfigValues<T>;
}

export abstract class VectorProvider<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  readonly pluginSettings: ConfigValues;

  constructor(args: VectorProviderArgs<T>) {
    this.pluginSettings = args.pluginSettings;
  }

  abstract upsert(
    documents: VectorDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void>;
  abstract delete(
    documentIds: string[],
    indexConfigValues: ConfigValues
  ): Promise<void>;
  abstract search(
    queryVector: number[],
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]>;
  abstract dropIndex(indexConfigValues: ConfigValues): Promise<void>;

  embedAndUpsert(
    documents: EmbedAndUpsertDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    throw new Error(
      `Embed and upsert is not implemented by the vector provider plugin.`
    );
  }

  embedAndSearch(
    queryText: string,
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    throw new Error(
      `Embed and search is not implemented by the vector provider plugin.`
    );
  }
}
