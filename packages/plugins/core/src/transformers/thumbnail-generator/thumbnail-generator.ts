import {
  AssetTransformer,
  AssetTransformerArgs,
  HandshakeArgs,
  HandshakeResult,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { FFmpegCommand, FFprobeCommand } from '../../lib/ffmpeg.js';
import { ThumbnailGeneratorInput } from './input.js';

export default class ThumbnailGenerator extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(args: HandshakeArgs): Promise<HandshakeResult> {
    const { input } = args;
    const format = input?.format || 'image/jpeg';
    const extension = this.getExtensionFromMimeType(format);

    return {
      variants: [
        {
          name: 'Thumbnail 1',
          entryPoint: `thumbnail-1.${extension}`,
          mimeType: format,
          type: 'THUMBNAIL',
        },
        {
          name: 'Thumbnail 2',
          entryPoint: `thumbnail-2.${extension}`,
          mimeType: format,
          type: 'THUMBNAIL',
        },
        {
          name: 'Thumbnail 3',
          entryPoint: `thumbnail-3.${extension}`,
          mimeType: format,
          type: 'THUMBNAIL',
        },
      ],
    };
  }

  async transform(
    args: TransformArgs<ThumbnailGeneratorInput>
  ): Promise<TransformResult> {
    const {
      source,
      input: { dimensions, format },
      variants,
    } = args;

    if (!source.url) {
      throw new Error('URL source is required for thumbnail generation');
    }

    const duration = await this.getVideoDuration(source.url);
    const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75];
    const results = await Promise.all(
      variants.map(async (variant, index) => {
        try {
          const timestamp = timestamps[index];
          await this.generateThumbnail(
            source.url!,
            timestamp,
            variant.fileOperations,
            variant.entryPoint,
            dimensions,
            format
          );
          return { id: variant.id };
        } catch (error) {
          return {
            id: variant.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return {
      variants: results,
    };
  }

  private async getVideoDuration(url: string): Promise<number> {
    let outputData = '';

    const ffprobe = new FFprobeCommand()
      .arg('-v', 'quiet')
      .arg('-print_format', 'json')
      .arg('-show_format')
      .arg('-i', url);

    try {
      await ffprobe.execute(async (stdout: any) => {
        for await (const chunk of stdout) {
          outputData += chunk.toString();
        }
      });

      const probe = JSON.parse(outputData);
      const duration = parseFloat(probe.format?.duration);
      if (!duration || isNaN(duration)) {
        throw new Error('Could not determine video duration');
      }
      return duration;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ffprobe')) {
        throw error;
      }
      throw new Error('Failed to parse FFprobe output');
    }
  }

  private async generateThumbnail(
    inputUrl: string,
    timestamp: number,
    fileOperations: any,
    outputPath: string,
    dimensions?: {
      width?: number;
      height?: number;
      maintainAspectRatio?: boolean;
    },
    format?: string
  ): Promise<void> {
    const formatMimeType = format || 'image/jpeg';
    const outputFormat = this.getFFmpegFormat(formatMimeType);

    const ffmpeg = new FFmpegCommand()
      .arg('-ss', String(timestamp))
      .arg('-i', inputUrl)
      .arg('-vframes', '1');

    // Build scale filter if dimensions are provided
    if (dimensions && (dimensions.width || dimensions.height)) {
      let scaleFilter = 'scale=';
      if (dimensions.maintainAspectRatio) {
        if (dimensions.width && dimensions.height) {
          scaleFilter += `${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease`;
        } else if (dimensions.width) {
          scaleFilter += `${dimensions.width}:-1`;
        } else if (dimensions.height) {
          scaleFilter += `-1:${dimensions.height}`;
        }
      } else {
        scaleFilter += `${dimensions.width || -1}:${dimensions.height || -1}`;
      }
      ffmpeg.arg('-vf', scaleFilter);
    }

    // Set output format and codec
    if (outputFormat === 'mjpeg') {
      ffmpeg.arg('-f', 'image2').arg('-vcodec', 'mjpeg');
    } else if (outputFormat === 'png') {
      ffmpeg.arg('-f', 'image2').arg('-vcodec', 'png');
    } else if (outputFormat === 'webp') {
      ffmpeg.arg('-f', 'webp').arg('-vcodec', 'libwebp');
    } else {
      ffmpeg.arg('-f', 'image2').arg('-vcodec', 'mjpeg');
    }

    // Output to stdout
    ffmpeg.arg('pipe:1');

    await ffmpeg.execute(async (stdout: any) => {
      await fileOperations.write(outputPath, stdout);
    });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'jpg';
  }

  private getFFmpegFormat(mimeType: string): string {
    const mimeToFormat: Record<string, string> = {
      'image/jpeg': 'mjpeg',
      'image/jpg': 'mjpeg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return mimeToFormat[mimeType] || 'mjpeg';
  }
}
