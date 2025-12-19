import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ContributionTemplate } from '../types/index.js';
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
  /**
   * A list of plugin-provided templates for the classifier.
   */
  templates?: Record<string, ContributionTemplate>;
}

export interface ClassifyResult {
  /**
   * Asset-level fields to update
   */
  asset?: {
    /**
     * The name of the asset
     */
    name?: string;
    /**
     * The metadata to update on the asset
     */
    metadata?: Record<string, unknown>;
  };
  /**
   * Variant-level fields to update
   */
  variant?: {
    /**
     * The width of the variant
     */
    width?: number;
    /**
     * The height of the variant
     */
    height?: number;
    /**
     * The duration of the variant
     */
    duration?: number;
    /**
     * The metadata to update on the variant
     */
    metadata?: Record<string, unknown>;
  };
}
