import { ConfigValues } from '@longpoint/config-schema';
import { LongpointMimeType, TransformerContribution } from '@longpoint/devkit';
import AdaptiveBitrateStream from './adaptive-bitrate-stream.js';
import absInputSchema from './input.js';

export const absContribution = {
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
  templates: {
    stream: {
      displayName: 'Stream',
      description: 'Streamable version of the source asset variant.',
      input: {
        name: 'Stream',
        playlist: 'HLS+DASH',
        includeSourceQuality: 'Always',
        qualities: [],
      } satisfies ConfigValues<typeof absInputSchema>,
    },
    hdAbs: {
      displayName: 'HD Adaptive Stream',
      description: 'HD streams that adapts to different devices and networks.',
      input: {
        name: 'Auto-HD Stream',
        playlist: 'HLS+DASH',
        qualities: [
          {
            name: '720P Stream',
            codec: 'h265',
            bitrate: 2000,
            dimensions: {
              width: 1280,
              height: 720,
              maintainAspectRatio: true,
            },
            allowUpscaling: false,
          },
          {
            name: '1080P Stream',
            codec: 'h265',
            bitrate: 4000,
            dimensions: {
              width: 1920,
              height: 1080,
              maintainAspectRatio: true,
            },
            allowUpscaling: false,
          },
        ],
        includeSourceQuality: 'Fallback',
      } satisfies ConfigValues<typeof absInputSchema>,
    },
  },
} satisfies TransformerContribution;

export default absContribution;
