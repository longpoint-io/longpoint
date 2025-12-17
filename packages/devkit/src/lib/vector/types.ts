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
   * A brief description of the search provider.
   */
  description?: string;
  /**
   * Whether the provider supports native embedding.
   */
  supportsEmbedding?: boolean;
  /**
   * Schema for configuring a search index.
   */
  indexConfigSchema?: ConfigSchemaDefinition;
}

export interface VectorPluginManifest {
  displayName?: string;
  description?: string;
  image?: string;
  supportsEmbedding?: boolean;
  indexConfigSchema?: ConfigSchemaDefinition;
  providerConfigSchema?: ConfigSchemaDefinition;
}

export interface VectorMetadata {
  [key: string]: string | number | boolean;
}

interface BaseVectorDocument {
  id: string;
  metadata?: VectorMetadata;
}

export interface VectorDocument extends BaseVectorDocument {
  embedding: number[];
}

export interface EmbedAndUpsertDocument extends BaseVectorDocument {
  text: string;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: VectorMetadata;
}
