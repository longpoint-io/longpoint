import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import dimensionsInputSchema from '../../lib/dimensions.js';

const videoTranscoderInputSchema = {
  dimensions: {
    ...dimensionsInputSchema,
    description: 'The output resolution of the video',
  },
} satisfies ConfigSchemaDefinition;

export type VideoTranscoderInput = ConfigValues<
  typeof videoTranscoderInputSchema
>;

export default videoTranscoderInputSchema;
