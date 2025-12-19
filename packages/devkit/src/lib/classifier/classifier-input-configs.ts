import {
  ConfigSchemaDefinition,
  ConfigSchemaValue,
} from '@longpoint/config-schema';

const metadataCapture = {
  label: 'Metadata fields to capture',
  type: 'array',
  maxLength: 10,
  items: {
    type: 'object',
    properties: {
      name: {
        label: 'Name',
        type: 'string',
        description: 'The name of the field to capture',
        required: true,
      },
      instructions: {
        label: 'Instructions',
        type: 'string',
        description: 'Instructions for filling the field',
      },
    },
  },
} satisfies ConfigSchemaValue;

/**
 * User-defined model outputs to capture from an LLM-like
 * classifier.
 */
export const llmClassifierInput = {
  assetName: {
    label: 'Asset name',
    type: 'object',
    properties: {
      enabled: {
        label: 'Enabled',
        type: 'boolean',
        description: 'Whether to generate a name for the asset',
      },
      instructions: {
        label: 'Instructions',
        type: 'string',
        description:
          'Optional instructions to guide the generation of the asset name',
      },
    },
  },
  assetMetadata: {
    ...metadataCapture,
    label: 'Asset metadata',
    description: 'Asset-level metadata to capture',
  },
  variantMetadata: {
    ...metadataCapture,
    label: 'Variant metadata',
    description: 'Variant-level metadata to capture',
  },
} satisfies ConfigSchemaDefinition;

export type LLMFieldCaptureInputValues = {
  assetName?: {
    enabled?: boolean;
    instructions?: string;
  };
  assetMetadata?: Array<{
    name: string;
    instructions?: string;
  }>;
  variantMetadata?: Array<{
    name: string;
    instructions?: string;
  }>;
};

/**
 * Builds field descriptions from classifier input configuration.
 * Returns an array of strings describing each field to capture, with optional instructions.
 */
export function buildFieldDescriptions(
  classifierInput: LLMFieldCaptureInputValues
): string[] {
  const fieldDescriptions: string[] = [];

  if (classifierInput.assetName?.enabled) {
    const instructions = classifierInput.assetName.instructions
      ? `: ${classifierInput.assetName.instructions}`
      : '';
    fieldDescriptions.push(`- assetName${instructions}`);
  }

  if (classifierInput.assetMetadata) {
    for (const field of classifierInput.assetMetadata) {
      const instructions = field.instructions ? `: ${field.instructions}` : '';
      fieldDescriptions.push(`- asset_${field.name}${instructions}`);
    }
  }

  if (classifierInput.variantMetadata) {
    for (const field of classifierInput.variantMetadata) {
      const instructions = field.instructions ? `: ${field.instructions}` : '';
      fieldDescriptions.push(`- variant_${field.name}${instructions}`);
    }
  }

  return fieldDescriptions;
}
