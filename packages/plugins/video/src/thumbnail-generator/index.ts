import { TransformerContribution } from '@longpoint/devkit';
import thumbnailGeneratorInputSchema from './input.js';
import ThumbnailGenerator from './thumbnail-generator.js';

const thumbnailGeneratorContribution = {
  transformer: ThumbnailGenerator,
  displayName: 'Thumbnail Generator',
  supportedMimeTypes: ['video/mp4', 'video/quicktime'],
  input: thumbnailGeneratorInputSchema,
} satisfies TransformerContribution;

export default thumbnailGeneratorContribution;
