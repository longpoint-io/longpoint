import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { Classifier, ClassifierArgs } from './classifier.js';

export interface ClassifierContribution<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  /**
   * Classifier implementation
   */
  classifier: new (args: ClassifierArgs<T>) => Classifier<T>;
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

export const KeyAssetMetadataField = {
  ASSET_NAME: 'assetName',
  WIDTH: 'width',
  HEIGHT: 'height',
  DURATION: 'duration',
} as const;

export type KeyAssetMetadataField =
  (typeof KeyAssetMetadataField)[keyof typeof KeyAssetMetadataField];

export interface ClassifyResult
  extends Partial<Record<KeyAssetMetadataField, any>> {
  width?: number;
  height?: number;
  duration?: number;
  assetName?: string;
  [key: string]: string | number | boolean | undefined;
}
