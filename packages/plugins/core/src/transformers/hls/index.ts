import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import Hls from './hls.js';
import hlsInputSchema from './input.js';

export const hlsContribution = {
  transformer: Hls,
  displayName: 'HTTP Live Streaming (HLS)',
  description:
    'Generate an HLS playlist from a video. Great for creating streamable versions of videos.',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
  ],
  input: hlsInputSchema,
} satisfies TransformerContribution;

export default hlsContribution;
