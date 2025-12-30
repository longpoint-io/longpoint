import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { SearchProvider, SearchProviderArgs } from './search-provider.js';

export interface SearchContribution<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * Search provider implementation
   */
  provider: new (args: SearchProviderArgs<T>) => SearchProvider;
  /**
   * A display name for the search provider.
   */
  displayName?: string;
  /**
   * Whether the search provider supports embeddings.
   */
  supportsEmbedding?: boolean;
  /**
   * A brief description of the search provider.
   */
  description?: string;
  /**
   * Schema for configuring a search index.
   */
  indexConfigSchema?: ConfigSchemaDefinition;
}

export interface DocumentMetadata {
  storageUnitId?: string;
  [key: string]: unknown;
}

export interface SearchDocument {
  id: string;
  textOrEmbedding: string | number[];
  metadata?: DocumentMetadata;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: DocumentMetadata;
}

export type MetadataFilter = Record<string, unknown>;

export interface SearchArgs {
  /**
   * The query text or embedding to search with.
   */
  query: string | number[];
  /**
   * The number of results to return.
   */
  pageSize?: number;
  /**
   * Optional metadata to filter the search results by.
   * @example {
   *   storageUnitId: 'mbjq36xe6397dsi6x9nq4ghc',
   *   category: 'Podcast',
   * }
   */
  metadata?: MetadataFilter;
}
