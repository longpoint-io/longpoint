import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import AnimatedPreview from './animated-preview.js';
import animatedPreviewInputSchema from './input.js';

export const animatedPreviewContribution = {
  transformer: AnimatedPreview,
  displayName: 'Animated Preview',
  description: 'Generate an animated preview image from a video',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
  ],
  input: animatedPreviewInputSchema,
  templates: {
    default: {
      displayName: 'Animated Preview',
      description: 'Default animated preview template',
      input: {
        fps: 15,
        duration: 3,
        dimensions: {
          width: 450,
          maintainAspectRatio: true,
        },
      },
    },
  },
} satisfies TransformerContribution;

export default animatedPreviewContribution;
