import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import dimensionsInputSchema from '../lib/dimensions.js';

const thumbnailGeneratorInputSchema = {
  dimensions: {
    ...dimensionsInputSchema,
    description: 'The thumbnail output resolution',
  },
  format: {
    label: 'Format',
    description: 'The output format of the thumbnail',
    type: 'string',
    enum: ['image/webp', 'image/jpg', 'image/jpeg', 'image/png'],
  },
} satisfies ConfigSchemaDefinition;

export type ThumbnailGeneratorInput = ConfigValues<
  typeof thumbnailGeneratorInputSchema
>;

export default thumbnailGeneratorInputSchema;
