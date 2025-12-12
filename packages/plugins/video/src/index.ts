import { LongpointPluginConfig } from '@longpoint/devkit';
import animatedPreviewContribution from './animated-preview/index.js';
import metadataExtractorContribution from './metadata-extractor/index.js';
import thumbnailGeneratorContribution from './thumbnail-generator/index.js';
import videoTranscoderContribution from './video-transcoder/index.js';

export default {
  icon: 'icon.png',
  displayName: 'Longpoint Core',
  description: 'The official core media processing functionality',
  contributes: {
    transformers: {
      transcoder: videoTranscoderContribution,
      thumbnailGenerator: thumbnailGeneratorContribution,
      animatedPreview: animatedPreviewContribution,
    },
    classifiers: {
      metadataExtractor: metadataExtractorContribution,
    },
  },
} satisfies LongpointPluginConfig;
