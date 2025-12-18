import { LongpointPluginConfig } from '@longpoint/devkit';
import metadataExtractorContribution from './classifiers/metadata-extractor/index.js';
import localStorageContribution from './storage/local/index.js';
import animatedPreviewContribution from './transformers/animated-preview/index.js';
import thumbnailGeneratorContribution from './transformers/thumbnail-generator/index.js';
import videoTranscoderContribution from './transformers/video-transcoder/index.js';

export default {
  icon: 'icon.png',
  displayName: 'Longpoint Core',
  description: 'The official core set of transformers, classifiers, and more.',
  contributes: {
    transformers: {
      transcoder: videoTranscoderContribution,
      thumbnailGenerator: thumbnailGeneratorContribution,
      animatedPreview: animatedPreviewContribution,
    },
    classifiers: {
      metadataExtractor: metadataExtractorContribution,
    },
    storage: {
      local: localStorageContribution,
    },
  },
} satisfies LongpointPluginConfig;
