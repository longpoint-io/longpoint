import { ConfigValues } from '@longpoint/config-schema';
import {
  AssetTransformer,
  AssetTransformerArgs,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { spawn } from 'child_process';
import input from '../input/index.js';

export class VideoTranscoder extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async transform(
    args: TransformArgs<ConfigValues<typeof input>>
  ): Promise<TransformResult> {
    const {
      source,
      input: { dimensions },
    } = args;

    // TODO: temporary
    if (!dimensions || (!dimensions.width && !dimensions.height)) {
      throw new Error('No dimensions specified');
    }

    // Get input video source
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

    const outputPath = `variant.mp4`;

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

    const writePromise = args.fileOperations.write(outputPath, ffmpeg.stdout);

    await Promise.all([writePromise, ffmpegPromise]);

    return {
      mimeType: 'video/mp4',
      entryPoint: outputPath,
    };
  }
}
