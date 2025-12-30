import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { SearchArgs, SearchDocument, SearchResult } from './types.js';

export interface SearchProviderArgs<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  pluginSettings: ConfigValues<T>;
}

export abstract class SearchProvider<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  readonly pluginSettings: ConfigValues;

  constructor(args: SearchProviderArgs<T>) {
    this.pluginSettings = args.pluginSettings;
  }

  /**
   * Upsert one or more documents into the search index.
   * @param documents
   * @param indexConfigValues
   */
  abstract upsert(
    documents: SearchDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void>;

  /**
   * Delete one or more documents from the search index.
   * @param documentIds
   * @param indexConfigValues
   */
  abstract delete(
    documentIds: string[],
    indexConfigValues: ConfigValues
  ): Promise<void>;

  /**
   * Search the search index for documents.
   * @param args
   * @param indexConfigValues
   */
  abstract search(
    args: SearchArgs,
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]>;

  /**
   * Delete all documents from the search index.
   * @param indexConfigValues
   */
  abstract dropIndex(indexConfigValues: ConfigValues): Promise<void>;
}
