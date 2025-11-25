import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import {
  ClassificationProvider,
  ClassificationProviderArgs,
} from './classification-provider.js';

export interface ClassifierContribution<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * Classification provider implementation
   */
  provider: new (
    args: ClassificationProviderArgs<T>
  ) => ClassificationProvider<T>;
  /**
   * A display name for the classifier.
   */
  displayName?: string;
  /**
   * A brief description of the classifier.
   */
  description?: string;
  /**
   * A list of supported input types.
   */
  supportedMimeTypes?: string[];
  /**
   * The max file input size for the classifier as a size string.
   * @example 5MB
   */
  maxFileSize?: string;
  /**
   * An input schema for user defined input to the classifier.
   */
  input?: ConfigSchemaDefinition;
}
