import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { VectorProvider, VectorProviderArgs } from './vector-provider.js';

export interface VectorContribution<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * Vector provider implementation
   */
  provider: new (args: VectorProviderArgs<T>) => VectorProvider;
  /**
   * A display name for the vector provider.
   */
  displayName?: string;
  /**
   * A brief description of the vector provider.
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
