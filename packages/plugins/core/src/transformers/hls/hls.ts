import {
  AssetTransformer,
  AssetTransformerArgs,
  HandshakeArgs,
  HandshakeResult,
  LongpointMimeType,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { FFmpegCommand, parseFFmpegError } from '../../lib/ffmpeg.js';
import { HlsInput } from './input.js';
import { SegmentUploader } from './segment-uploader.js';

export default class Hls extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(args: HandshakeArgs<HlsInput>): Promise<HandshakeResult> {
    return {
      variants: [
        {
          name: args.input.name || 'HLS Playlist',
          entryPoint: 'playlist.m3u8',
          mimeType: LongpointMimeType.M3U8,
          type: 'DERIVATIVE',
        },
      ],
    };
  }

  async transform(args: TransformArgs<HlsInput>): Promise<TransformResult> {
    const {
      source,
      input: { segmentDuration, dimensions, videoBitrate },
      variants,
    } = args;

    if (!source.url) {
      throw new Error('URL source is required for HLS generation');
    }

    const outputVariant = variants[0];
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hls-'));
    const playlistPath = path.join(tempDir, 'playlist.m3u8');

    const uploader = new SegmentUploader(tempDir, outputVariant);

    try {
      uploader.setupWatcher();

      const ffmpeg = this.buildFFmpegCommand({
        sourceUrl: source.url,
        dimensions,
        videoBitrate,
        segmentDuration: segmentDuration || 6,
        tempDir,
        playlistPath,
      });

      await this.executeFFmpeg(ffmpeg);

      await this.waitForSegmentsToComplete(uploader);

      await this.uploadPlaylist(playlistPath, tempDir, outputVariant);

      return {
        variants: [{ id: outputVariant.id }],
      };
    } catch (error) {
      return {
        variants: [
          {
            id: outputVariant.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    } finally {
      uploader.cleanup();
      await this.cleanupTempDirectory(tempDir);
    }
  }

  private buildFFmpegCommand({
    sourceUrl,
    dimensions,
    videoBitrate,
    segmentDuration,
    tempDir,
    playlistPath,
  }: {
    sourceUrl: string;
    dimensions?: HlsInput['dimensions'];
    videoBitrate?: number;
    segmentDuration: number;
    tempDir: string;
    playlistPath: string;
  }): FFmpegCommand {
    const ffmpeg = new FFmpegCommand().arg('-i', sourceUrl);

    const scaleFilter = this.buildScaleFilter(dimensions);
    if (scaleFilter) {
      ffmpeg.arg('-vf', scaleFilter);
    }

    ffmpeg.arg('-c:v', 'libx264').arg('-preset', 'fast');
    if (videoBitrate) {
      ffmpeg.arg('-b:v', `${videoBitrate}k`);
    }

    ffmpeg.arg('-c:a', 'aac').arg('-b:a', '128k');

    ffmpeg
      .arg('-f', 'hls')
      .arg('-hls_time', String(segmentDuration))
      .arg('-hls_list_size', '0')
      .arg('-hls_segment_filename', path.join(tempDir, 'segment_%03d.ts'))
      .arg(playlistPath);

    return ffmpeg;
  }

  private buildScaleFilter(dimensions?: HlsInput['dimensions']): string | null {
    if (!dimensions || (!dimensions.width && !dimensions.height)) {
      return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    }

    if (dimensions.maintainAspectRatio) {
      return this.buildAspectRatioScaleFilter(dimensions);
    }

    const evenDims = this.ensureEvenDimensions(
      dimensions.width,
      dimensions.height
    );
    return `scale=${evenDims.width || -2}:${evenDims.height || -2}`;
  }

  private buildAspectRatioScaleFilter(
    dimensions: NonNullable<HlsInput['dimensions']>
  ): string {
    if (dimensions.width && dimensions.height) {
      const evenDims = this.ensureEvenDimensions(
        dimensions.width,
        dimensions.height
      );
      return `scale=${evenDims.width}:-2:force_original_aspect_ratio=decrease`;
    }

    if (dimensions.width) {
      const evenDims = this.ensureEvenDimensions(dimensions.width, undefined);
      return `scale=${evenDims.width}:-2`;
    }

    if (dimensions.height) {
      const evenDims = this.ensureEvenDimensions(undefined, dimensions.height);
      return `scale=-2:${evenDims.height}`;
    }

    return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  }

  private async executeFFmpeg(ffmpeg: FFmpegCommand): Promise<void> {
    await ffmpeg.executeToFiles(undefined, (stderrData, code) => {
      const parsedError = parseFFmpegError(stderrData);
      const errorMessage = this.formatFFmpegError(parsedError, code);
      return new Error(errorMessage);
    });
  }

  private formatFFmpegError(parsedError: string, code: number): string {
    if (parsedError.toLowerCase().includes('not divisible by')) {
      const dimensionMatch = parsedError.match(/(\d+)x(\d+)/);
      if (dimensionMatch) {
        const [, width, height] = dimensionMatch;
        return `Video dimensions (${width}x${height}) must be divisible by 2 for H.264 encoding. The transformer should automatically fix this, but if the error persists, try adjusting your dimensions to even numbers.`;
      }
      return `Video dimensions must be divisible by 2 for H.264 encoding. ${parsedError}`;
    }

    if (
      parsedError.toLowerCase().includes('error while opening encoder') ||
      parsedError.toLowerCase().includes('could not open encoder')
    ) {
      return `Failed to initialize video encoder: ${parsedError}. This may be due to invalid dimensions, codec settings, or unsupported video format.`;
    }

    if (parsedError.toLowerCase().includes('conversion failed')) {
      return `Video conversion failed: ${parsedError}`;
    }

    if (parsedError.length === 0) {
      return `FFmpeg exited with code ${code}. The video may be in an unsupported format or have invalid settings.`;
    }

    return parsedError;
  }

  private async waitForSegmentsToComplete(
    uploader: SegmentUploader
  ): Promise<void> {
    await uploader.waitForCompletion();
    await uploader.queueRemainingSegments();
    await uploader.uploadRemainingSegments();
  }

  private async uploadPlaylist(
    playlistPath: string,
    tempDir: string,
    outputVariant: TransformArgs<HlsInput>['variants'][0]
  ): Promise<void> {
    await fs.access(playlistPath);

    let playlistContent = await fs.readFile(playlistPath, 'utf-8');
    playlistContent = playlistContent.replace(
      /^([^#\s].*\.ts)$/gm,
      'segments/$1'
    );

    const modifiedPlaylistPath = path.join(tempDir, 'playlist_modified.m3u8');
    await fs.writeFile(modifiedPlaylistPath, playlistContent, 'utf-8');

    const playlistStream = createReadStream(modifiedPlaylistPath);
    await outputVariant.fileOperations.write(
      outputVariant.entryPoint,
      playlistStream
    );

    await fs.unlink(playlistPath);
    await fs.unlink(modifiedPlaylistPath).catch(() => {});
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      const remaining = await fs.readdir(tempDir);
      await Promise.all(
        remaining.map((file) =>
          fs.unlink(path.join(tempDir, file)).catch(() => {})
        )
      );
      await fs.rmdir(tempDir);
    } catch (error) {
      // Best effort cleanup - ignore errors
    }
  }

  /**
   * Ensure dimensions are even (required by libx264).
   * Rounds down to nearest even number.
   */
  private ensureEvenDimensions(
    width?: number,
    height?: number
  ): { width?: number; height?: number } {
    const result: { width?: number; height?: number } = {};
    if (width !== undefined) {
      result.width = width % 2 === 0 ? width : width - 1;
    }
    if (height !== undefined) {
      result.height = height % 2 === 0 ? height : height - 1;
    }
    return result;
  }
}
