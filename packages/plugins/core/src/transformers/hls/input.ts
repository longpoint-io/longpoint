import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import dimensionsInputSchema from '../../lib/dimensions.js';

const hlsInputSchema = {
  name: {
    label: 'Name',
    description: 'A name for the variant',
    type: 'string',
    placeholder: 'e.g. 720p Stream',
    required: false,
  },
  segmentDuration: {
    label: 'Segment Duration',
    description: 'Duration of each HLS segment in seconds',
    type: 'number',
    placeholder: '6',
    minLength: 1,
    maxLength: 60,
  },
  dimensions: {
    ...dimensionsInputSchema,
    description:
      'Optional video resolution. If not specified, original resolution is used.',
  },
  videoBitrate: {
    label: 'Video Bitrate',
    description: 'Video bitrate in kbps (e.g., 2000 for 2Mbps)',
    type: 'number',
    placeholder: '2000',
    minLength: 100,
    maxLength: 50000,
  },
} satisfies ConfigSchemaDefinition;

export type HlsInput = ConfigValues<typeof hlsInputSchema>;

export default hlsInputSchema;
