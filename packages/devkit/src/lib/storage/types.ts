import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { StorageProvider, StorageProviderArgs } from './storage-provider.js';

export interface SignedUrlResponse {
  /**
   * The signed URL to the asset
   */
  url: string;
  /**
   * The date and time the URL will expire
   */
  expiresAt: Date;
}

export interface CreateSignedUrlOptions {
  /**
   * The relative path to the asset within the container
   */
  path: string;
  /**
   * The action to perform on the asset
   */
  action?: 'read' | 'write';
  /**
   * The number of seconds the URL will be valid for
   */
  expiresInSeconds?: number;
}

export interface StoragePluginManifest {
  displayName?: string;
  configSchema?: ConfigSchemaDefinition;
  image?: string;
}

export interface StorageContribution<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * Storage provider implementation
   */
  provider: new (args: StorageProviderArgs<T>) => StorageProvider;
  /**
   * A display name for the storage provider.
   */
  displayName?: string;
  /**
   * A brief description of the storage provider.
   */
  description?: string;
  /**
   * Schema for configuring the storage provider.
   */
  configSchema?: ConfigSchemaDefinition;
}
