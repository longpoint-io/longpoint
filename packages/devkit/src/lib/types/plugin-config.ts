import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ClassifierContribution } from '../classifier/types.js';
import { StorageContribution } from '../storage/index.js';
import { TransformerContribution } from '../transformer/types.js';
import { VectorContribution, VectorPluginManifest } from '../vector/types.js';
import {
  VectorProvider,
  VectorProviderArgs,
} from '../vector/vector-provider.js';

type PluginType = 'vector';

export interface BasePluginConfig {
  /**
   * The plugin type
   */
  type: PluginType;
}

export interface VectorPluginConfig<
  T extends VectorPluginManifest = VectorPluginManifest
> extends BasePluginConfig {
  type: 'vector';
  manifest: T;
  provider: new (args: VectorProviderArgs) => VectorProvider;
}

export type PluginConfig = VectorPluginConfig<any>;

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
      [id: string]: StorageContribution<T>;
    };
    vector?: {
      [id: string]: VectorContribution<T>;
    };
    classifiers?: {
      [id: string]: ClassifierContribution<T>;
    };
    transformers?: {
      [id: string]: TransformerContribution;
    };
  };
}
