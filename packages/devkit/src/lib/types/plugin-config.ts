import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ClassifierContribution } from '../classifier/types.js';
import { SearchContribution } from '../search/types.js';
import { StorageContribution } from '../storage/index.js';
import { TransformerContribution } from '../transformer/types.js';

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
    search?: {
      [id: string]: SearchContribution<T>;
    };
    classifiers?: {
      [id: string]: ClassifierContribution<T>;
    };
    transformers?: {
      [id: string]: TransformerContribution<T>;
    };
  };
}
