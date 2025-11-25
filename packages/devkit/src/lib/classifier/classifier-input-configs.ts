import { ConfigSchemaDefinition } from '@longpoint/config-schema';

/**
 * User-defined model outputs to capture from an LLM-like
 * classifier.
 */
export const llmFieldCapture = {
  fieldCapture: {
    label: 'Fields to capture',
    type: 'array',
    required: true,
    minLength: 1,
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
  },
} satisfies ConfigSchemaDefinition;

export type LLMFieldCaptureInputValues = {
  fieldCapture: Array<{
    name: string;
    instructions?: string;
  }>;
};
