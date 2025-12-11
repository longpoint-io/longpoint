import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { AssetTransformer, AssetTransformerArgs } from './asset-transformer.js';

export interface TransformerContribution {
  transformer: new (args: AssetTransformerArgs) => AssetTransformer;
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
}
