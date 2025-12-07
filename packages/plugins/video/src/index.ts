import { LongpointPluginConfig } from '@longpoint/devkit';
import input from './input/index.js';
import { VideoTranscoder } from './transcoder/transcoder.js';

export default {
  displayName: 'Video',
  description: 'Longpoint official video plugin',
  contributes: {
    transformers: {
      transcoder: {
        transformer: VideoTranscoder,
        displayName: 'Video Transcoder',
        supportedMimeTypes: ['video/mp4', 'video/mov'],
        input,
      },
    },
  },
} satisfies LongpointPluginConfig;
