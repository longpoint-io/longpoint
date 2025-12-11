import { TransformerContribution } from '@longpoint/devkit';
import videoTranscoderInputSchema from './input.js';
import VideoTranscoder from './video-transcoder.js';

const videoTranscoderContribution = {
  transformer: VideoTranscoder,
  displayName: 'Video Transcoder',
  supportedMimeTypes: ['video/mp4', 'video/quicktime'],
  input: videoTranscoderInputSchema,
} satisfies TransformerContribution;

export default videoTranscoderContribution;
