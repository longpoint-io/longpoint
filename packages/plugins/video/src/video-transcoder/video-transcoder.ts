import {
  AssetTransformer,
  AssetTransformerArgs,
  HandshakeArgs,
  HandshakeResult,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { spawn } from 'child_process';
import { VideoTranscoderInput } from './input.js';

export default class VideoTranscoder extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(args: HandshakeArgs): Promise<HandshakeResult> {
    return {
      variants: [
        {
          entryPoint: 'variant.mp4',
          mimeType: 'video/mp4',
          type: 'DERIVATIVE',
        },
      ],
    };
  }

  async transform(
    args: TransformArgs<VideoTranscoderInput>
  ): Promise<TransformResult> {
    const {
      source,
      input: { dimensions },
      variants,
    } = args;

    // TODO: temporary
    if (!dimensions || (!dimensions.width && !dimensions.height)) {
      throw new Error('No dimensions specified');
    }

    let inputSource: string;
    if (source.url) {
      inputSource = source.url;
    } else if (source.base64) {
      throw new Error(
        'Base64 input not yet supported. Please provide a URL source.'
      );
    } else {
      throw new Error('No valid video source provided');
    }

    const ffmpegArgs = [
      '-i',
      inputSource,
      '-vf',
      `scale=${dimensions.width}:${dimensions.height}`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      String(23),
      '-c:a',
      'aac',
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      'mp4',
      'pipe:1',
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderrData = '';
    ffmpeg.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    const outputVariant = variants[0];

    const ffmpegPromise = new Promise<void>((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderrData}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start ffmpeg: ${err.message}`));
      });
    });

    const writePromise = outputVariant.fileOperations.write(
      outputVariant.entryPoint,
      ffmpeg.stdout
    );

    try {
      await Promise.all([writePromise, ffmpegPromise]);
      return {
        variants: [
          {
            id: outputVariant.id,
          },
        ],
      };
    } catch (e) {
      return {
        variants: [
          {
            id: outputVariant.id,
            error: e instanceof Error ? e.message : 'Unknown error',
          },
        ],
      };
    }
  }
}
