import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import videoTranscoderInputSchema from './input.js';
import VideoTranscoder from './video-transcoder.js';

const videoTranscoderContribution = {
  transformer: VideoTranscoder,
  displayName: 'Video Transcoder',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
  ],
  input: videoTranscoderInputSchema,
} satisfies TransformerContribution;

export default videoTranscoderContribution;
