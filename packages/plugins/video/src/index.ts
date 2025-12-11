import { LongpointPluginConfig } from '@longpoint/devkit';
import metadataExtractorContribution from './metadata-extractor/index.js';
import thumbnailGeneratorContribution from './thumbnail-generator/index.js';
import videoTranscoderContribution from './video-transcoder/index.js';

export default {
  displayName: 'Longpoint Core',
  description: 'The official Longpoint plugin for core media processing',
  contributes: {
    transformers: {
      transcoder: videoTranscoderContribution,
      thumbnailGenerator: thumbnailGeneratorContribution,
    },
    classifiers: {
      metadataExtractor: metadataExtractorContribution,
    },
  },
} satisfies LongpointPluginConfig;
