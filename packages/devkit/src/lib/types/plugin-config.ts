import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { AiPluginManifest } from '../ai/ai-manifest.js';
import {
  AiProviderPlugin,
  AiProviderPluginArgs,
} from '../ai/ai-provider-plugin.js';
import { ClassifierContribution } from '../classifier/types.js';
import {
  StoragePluginManifest,
  StorageProviderPlugin,
  StorageProviderPluginArgs,
} from '../storage/index.js';
import { VectorContribution, VectorPluginManifest } from '../vector/types.js';
import {
  VectorProvider,
  VectorProviderArgs,
} from '../vector/vector-provider.js';

type PluginType = 'storage' | 'ai' | 'vector';

export interface BasePluginConfig {
  /**
   * The plugin type
   */
  type: PluginType;
}

export interface StoragePluginConfig<
  T extends StoragePluginManifest = StoragePluginManifest
> extends BasePluginConfig {
  type: 'storage';
  manifest: T;
  provider: new (
    args: StorageProviderPluginArgs<T>
  ) => StorageProviderPlugin<T>;
}

export interface AiPluginConfig<T extends AiPluginManifest = AiPluginManifest>
  extends BasePluginConfig {
  type: 'ai';
  manifest: T;
  provider: new (args: AiProviderPluginArgs<T>) => AiProviderPlugin<T>;
}

export interface VectorPluginConfig<
  T extends VectorPluginManifest = VectorPluginManifest
> extends BasePluginConfig {
  type: 'vector';
  manifest: T;
  provider: new (args: VectorProviderArgs) => VectorProvider;
}

export type PluginConfig =
  | StoragePluginConfig<any>
  | AiPluginConfig<any>
  | VectorPluginConfig<any>;

export interface LongpointPluginConfig<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * The display name for the plugin.
   */
  displayName?: string;
  /**
   * A brief description of the plugin.
   */
  description?: string;
  /**
   * A URL or relative path to an icon image.
   */
  icon?: string;
  contributes?: {
    settings?: T;
    storage?: {
      [id: string]: {
        // provider: StorageProviderPlugin;
      };
    };
    vector?: {
      [id: string]: VectorContribution<T>;
    };
    classifiers?: {
      [id: string]: ClassifierContribution<T>;
    };
  };
}
