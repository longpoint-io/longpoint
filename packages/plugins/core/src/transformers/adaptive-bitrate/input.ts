import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import dimensionsInputSchema from '../../lib/dimensions.js';

const absInputSchema = {
  name: {
    label: 'Name',
    description: 'A name for the variant',
    type: 'string',
    placeholder: 'e.g. ABR Stream',
    required: false,
  },
  playlist: {
    label: 'Playlist',
    type: 'string',
    enum: ['HLS+DASH', 'HLS', 'DASH'],
    description:
      'The playlist type to generate. HLS+DASH will generate two playlist variants that can be used with both HLS and DASH players.',
  },
  includeSourceQuality: {
    label: 'Include Source Quality',
    type: 'string',
    description:
      'Whether to include the source quality in the ABR stream. Fallback will only generate a source quality variant if other qualities are not produced.',
    enum: ['Fallback', 'Always', 'Never'],
  },
  qualities: {
    label: 'Qualities',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: {
          label: 'Name',
          description: 'A name for the quality variant',
          type: 'string',
          placeholder: 'e.g. 720p Stream',
        },
        dimensions: {
          ...dimensionsInputSchema,
          description: 'The output resolution of the video',
        },
        bitrate: {
          label: 'Bitrate',
          type: 'number',
          description:
            'The bitrate of the video in kbps. Leave blank to auto-determine based on the source video.',
          placeholder: 'e.g. 2000',
        },
        codec: {
          label: 'Codec',
          type: 'string',
          description:
            'The codec to use for the video. If not specified, the source codec will be used.',
          enum: ['h264', 'h265', 'vp9', 'av1', 'source'],
        },
        allowUpscaling: {
          label: 'Allow Upscaling',
          type: 'boolean',
          description:
            'Force allow upscaling if the source video is lower resolution. May result in lower quality result.',
        },
      },
    },
  },
  // segmentDuration: {
  //   label: 'Segment Duration',
  //   description: 'Duration of each HLS segment in seconds',
  //   type: 'number',
  //   placeholder: '6',
  //   minLength: 1,
  //   maxLength: 60,
  // },
  // dimensions: {
  //   ...dimensionsInputSchema,
  //   description:
  //     'Optional video resolution. If not specified, original resolution is used.',
  // },
  // videoBitrate: {
  //   label: 'Video Bitrate',
  //   description: 'Video bitrate in kbps (e.g., 2000 for 2Mbps)',
  //   type: 'number',
  //   placeholder: '2000',
  //   minLength: 100,
  //   maxLength: 50000,
  // },
} satisfies ConfigSchemaDefinition;

export type AdaptiveBitrateStreamInput = ConfigValues<typeof absInputSchema>;

export type QualityConfig = NonNullable<
  AdaptiveBitrateStreamInput['qualities']
>[number];

export default absInputSchema;
