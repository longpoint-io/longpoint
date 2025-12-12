import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import dimensionsInputSchema from '../lib/dimensions.js';

const animatedPreviewInputSchema = {
  dimensions: dimensionsInputSchema,
  fps: {
    label: 'FPS',
    description:
      'The frames per second. Higher values will result in a larger file size',
    type: 'number',
    maxLength: 30,
    minLength: 1,
    placeholder: '15',
  },
  duration: {
    label: 'Duration',
    description: 'The duration in seconds',
    type: 'number',
    placeholder: '3',
    maxLength: 10,
    minLength: 1,
  },
} satisfies ConfigSchemaDefinition;

export type AnimatedPreviewInput = ConfigValues<
  typeof animatedPreviewInputSchema
>;

export default animatedPreviewInputSchema;
