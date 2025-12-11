import { LongpointPluginConfig } from '@longpoint/devkit';
import thumbnailGeneratorContribution from './thumbnail-generator/index.js';
import videoTranscoderContribution from './video-transcoder/index.js';

export default {
  displayName: 'Longpoint Video',
  description: 'The official Longpoint video plugin',
  contributes: {
    transformers: {
      transcoder: videoTranscoderContribution,
      thumbnailGenerator: thumbnailGeneratorContribution,
    },
  },
} satisfies LongpointPluginConfig;
