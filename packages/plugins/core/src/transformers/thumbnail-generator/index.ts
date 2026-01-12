import { ConfigValues } from '@longpoint/config-schema';
import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import thumbnailGeneratorInputSchema from './input.js';
import ThumbnailGenerator from './thumbnail-generator.js';

const thumbnailGeneratorContribution = {
  transformer: ThumbnailGenerator,
  displayName: 'Thumbnail Generator',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
  ],
  input: thumbnailGeneratorInputSchema,
  templates: {
    thumbnails: {
      displayName: 'Generate Thumbnails',
      description:
        'Generate thumbnails at 25%, 50%, and 75% of the video duration.',
      input: {
        format: 'image/webp',
        dimensions: {
          width: 600,
          maintainAspectRatio: true,
        },
      } satisfies ConfigValues<typeof thumbnailGeneratorInputSchema>,
    },
  },
} satisfies TransformerContribution;

export default thumbnailGeneratorContribution;
