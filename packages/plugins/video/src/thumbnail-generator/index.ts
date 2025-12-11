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
} satisfies TransformerContribution;

export default thumbnailGeneratorContribution;
