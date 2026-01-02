import {
  AssetTransformer,
  AssetTransformerArgs,
  HandshakeArgs,
  HandshakeResult,
  LongpointMimeType,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { createReadStream, watch } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { FFmpegCommand, parseFFmpegError } from '../../lib/ffmpeg.js';
import { HlsInput } from './input.js';

export default class Hls extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(args: HandshakeArgs<HlsInput>): Promise<HandshakeResult> {
    return {
      variants: [
        {
          name: 'HLS Playlist',
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

    // Track which files we've uploaded
    const uploadedFiles = new Set<string>();
    let watcher: ReturnType<typeof watch> | null = null;

    try {
      // Set up file watcher to upload segments as they're created
      watcher = watch(tempDir, async (eventType, filename) => {
        if (!filename || uploadedFiles.has(filename)) return;

        // Only process segment files (.ts), not the playlist
        if (!filename.endsWith('.ts')) return;

        const filePath = path.join(tempDir, filename);

        // Wait a moment to ensure FFmpeg finished writing
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          // Check if file exists and is readable
          await fs.access(filePath);

          // Stream segment to storage
          const relativePath = `segments/${filename}`;
          const fileStream = createReadStream(filePath);
          await outputVariant.fileOperations.write(relativePath, fileStream);

          uploadedFiles.add(filename);

          // Delete the temp file immediately after successful upload
          await fs.unlink(filePath);
        } catch (error) {
          // Log error but don't delete - might need to retry
          console.error(`Failed to upload segment ${filename}:`, error);
        }
      });

      // Build FFmpeg command using the utility
      const ffmpeg = new FFmpegCommand().arg('-i', source.url);

      // Add video filter if dimensions are provided
      // Note: libx264 requires dimensions to be divisible by 2
      if (dimensions && (dimensions.width || dimensions.height)) {
        let scaleFilter = 'scale=';
        if (dimensions.maintainAspectRatio) {
          if (dimensions.width && dimensions.height) {
            // Ensure both dimensions are even, then scale maintaining aspect ratio
            // Use -2 for both to ensure output is always even
            const evenDims = this.ensureEvenDimensions(
              dimensions.width,
              dimensions.height
            );
            scaleFilter += `${evenDims.width}:-2:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
          } else if (dimensions.width) {
            // Ensure width is even, height will be calculated and made even
            const evenDims = this.ensureEvenDimensions(
              dimensions.width,
              undefined
            );
            scaleFilter += `${evenDims.width}:-2`; // -2 ensures even height
          } else if (dimensions.height) {
            // Ensure height is even, width will be calculated and made even
            const evenDims = this.ensureEvenDimensions(
              undefined,
              dimensions.height
            );
            scaleFilter += `-2:${evenDims.height}`; // -2 ensures even width
          }
        } else {
          // Ensure both dimensions are even
          const evenDims = this.ensureEvenDimensions(
            dimensions.width,
            dimensions.height
          );
          scaleFilter += `${evenDims.width || -2}:${evenDims.height || -2}`;
        }
        ffmpeg.arg('-vf', scaleFilter);
      } else {
        // Ensure output dimensions are divisible by 2 (required by libx264)
        // This handles cases where source video has odd dimensions
        ffmpeg.arg('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2');
      }

      // Video codec settings
      ffmpeg.arg('-c:v', 'libx264').arg('-preset', 'fast');
      if (videoBitrate) {
        ffmpeg.arg('-b:v', `${videoBitrate}k`);
      }

      // Audio codec settings
      ffmpeg.arg('-c:a', 'aac').arg('-b:a', '128k');

      // HLS format settings
      ffmpeg
        .arg('-f', 'hls')
        .arg('-hls_time', String(segmentDuration || 6))
        .arg('-hls_list_size', '0')
        .arg('-hls_segment_filename', path.join(tempDir, 'segment_%03d.ts'))
        .arg(playlistPath);

      // Execute FFmpeg with HLS-specific error parsing
      await ffmpeg.executeToFiles(undefined, (stderrData, code) => {
        const parsedError = parseFFmpegError(stderrData);

        // Provide helpful messages for common errors
        let errorMessage = parsedError;
        if (parsedError.toLowerCase().includes('not divisible by')) {
          const dimensionMatch = parsedError.match(/(\d+)x(\d+)/);
          if (dimensionMatch) {
            const [, width, height] = dimensionMatch;
            errorMessage = `Video dimensions (${width}x${height}) must be divisible by 2 for H.264 encoding. The transformer should automatically fix this, but if the error persists, try adjusting your dimensions to even numbers.`;
          } else {
            errorMessage = `Video dimensions must be divisible by 2 for H.264 encoding. ${parsedError}`;
          }
        } else if (
          parsedError.toLowerCase().includes('error while opening encoder') ||
          parsedError.toLowerCase().includes('could not open encoder')
        ) {
          errorMessage = `Failed to initialize video encoder: ${parsedError}. This may be due to invalid dimensions, codec settings, or unsupported video format.`;
        } else if (parsedError.toLowerCase().includes('conversion failed')) {
          errorMessage = `Video conversion failed: ${parsedError}`;
        } else if (parsedError.length === 0) {
          errorMessage = `FFmpeg exited with code ${code}. The video may be in an unsupported format or have invalid settings.`;
        }

        return new Error(errorMessage);
      });

      // Wait a moment for any final files
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Upload any remaining segment files
      const remainingFiles = await fs.readdir(tempDir);
      for (const file of remainingFiles) {
        if (file.endsWith('.ts') && !uploadedFiles.has(file)) {
          const filePath = path.join(tempDir, file);
          try {
            const relativePath = `segments/${file}`;
            const fileStream = createReadStream(filePath);
            await outputVariant.fileOperations.write(relativePath, fileStream);
            await fs.unlink(filePath); // Delete immediately
            uploadedFiles.add(file);
          } catch (error) {
            console.error(`Failed to upload remaining segment ${file}:`, error);
          }
        }
      }

      // Upload final playlist (after all segments are done)
      try {
        await fs.access(playlistPath);
        const playlistStream = createReadStream(playlistPath);
        await outputVariant.fileOperations.write(
          outputVariant.entryPoint,
          playlistStream
        );
        await fs.unlink(playlistPath);
      } catch (error) {
        throw new Error(
          `Failed to upload playlist file: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }

      return {
        variants: [
          {
            id: outputVariant.id,
          },
        ],
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
      // Clean up watcher
      if (watcher) {
        watcher.close();
      }

      // Final cleanup - remove any remaining files and temp directory
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
