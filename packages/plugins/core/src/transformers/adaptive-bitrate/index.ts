import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import AdaptiveBitrateStream from './adaptive-bitrate-stream.js';
import absInputSchema from './input.js';

export const abrContribution = {
  transformer: AdaptiveBitrateStream,
  displayName: 'Adaptive Bitrate Stream (ABS)',
  description:
    'Create streamable video that adapts to different devices and networks.',
  supportedMimeTypes: [
    LongpointMimeType.MP4,
    LongpointMimeType.MOV,
    LongpointMimeType.WEBM,
    LongpointMimeType.MKV,
  ],
  input: absInputSchema,
} satisfies TransformerContribution;

export default abrContribution;
