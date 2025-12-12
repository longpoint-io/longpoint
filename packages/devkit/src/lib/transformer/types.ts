import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ContributionTemplate } from '../types/index.js';
import { AssetTransformer, AssetTransformerArgs } from './asset-transformer.js';

export interface TransformerContribution<
  PluginSettingsSchema extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  transformer: new (
    args: AssetTransformerArgs<PluginSettingsSchema>
  ) => AssetTransformer;
  displayName?: string;
  description?: string;
  /**
   * A list of supported asset mime types.
   */
  supportedMimeTypes?: string[];
  /**
   * A schema defining the user-provided input to the transformer.
   */
  input?: ConfigSchemaDefinition;
  templates?: ContributionTemplate[];
}
