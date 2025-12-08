import { ConfigValues } from '@longpoint/config-schema';
import {
  AssetTransformer,
  AssetTransformerArgs,
  TransformArgs,
} from '@longpoint/devkit';
import { spawn } from 'child_process';
import { Readable } from 'stream';
import input from '../input/index.js';

export class VideoTranscoder extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async transform(
    args: TransformArgs<ConfigValues<typeof input>>
  ): Promise<void> {
    const {
      source,
      input: { dimensions },
    } = args;

    // If no dimensions specified, skip transformation
    if (!dimensions || (!dimensions.width && !dimensions.height)) {
      return;
    }

    // Get input video source
    let inputSource: string;
    if (source.url) {
      inputSource = source.url;
    } else if (source.base64) {
      // For base64, we'd need to write to a temp file first
      // For now, we'll require URL input
      throw new Error(
        'Base64 input not yet supported. Please provide a URL source.'
      );
    } else {
      throw new Error('No valid video source provided');
    }

    // Build ffmpeg command arguments
    const ffmpegArgs = [
      '-i',
      inputSource,
      '-c:v',
      'libx264',
      '-c:a',
      'copy', // Copy audio without re-encoding
    ];

    // Handle dimensions
    if (dimensions.width && dimensions.height) {
      if (dimensions.maintainAspectRatio) {
        // Use scale filter with aspect ratio preservation
        ffmpegArgs.push(
          '-vf',
          `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2`
        );
      } else {
        // Direct resize without aspect ratio preservation
        ffmpegArgs.push(
          '-vf',
          `scale=${dimensions.width}:${dimensions.height}`
        );
      }
    } else if (dimensions.width) {
      // Only width specified - always maintain aspect ratio
      ffmpegArgs.push('-vf', `scale=${dimensions.width}:-1`);
    } else if (dimensions.height) {
      // Only height specified - always maintain aspect ratio
      ffmpegArgs.push('-vf', `scale=-1:${dimensions.height}`);
    }

    // Output to stdout as MP4
    ffmpegArgs.push('-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov', '-');

    // Execute ffmpeg
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Handle errors
    let errorOutput = '';
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Create readable stream from ffmpeg stdout
    const outputStream = ffmpeg.stdout as Readable;

    // Generate output path - simple naming for now
    // In production, this would likely be determined by the calling system
    const timestamp = Date.now();
    const outputPath = `transformed_${timestamp}.mp4`;

    // Wait for ffmpeg to complete and handle errors
    const ffmpegPromise = new Promise<void>((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(
            new Error(`FFmpeg process failed with code ${code}: ${errorOutput}`)
          );
        } else {
          resolve();
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });

    // Write output stream to file operations
    await args.fileOperations.write(outputPath, outputStream);

    // Wait for ffmpeg to complete
    await ffmpegPromise;
  }
}
