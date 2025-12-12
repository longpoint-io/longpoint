import {
  AssetTransformer,
  AssetTransformerArgs,
  HandshakeArgs,
  HandshakeResult,
  TransformArgs,
  TransformResult,
} from '@longpoint/devkit';
import { FFmpegCommand } from '../lib/ffmpeg.js';
import { AnimatedPreviewInput } from './input.js';

export default class AnimatedPreview extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(args: HandshakeArgs): Promise<HandshakeResult> {
    return {
      variants: [
        {
          name: 'Animated Preview',
          entryPoint: 'animated-preview.gif',
          mimeType: 'image/gif',
          type: 'THUMBNAIL',
        },
      ],
    };
  }

  async transform(
    args: TransformArgs<AnimatedPreviewInput>
  ): Promise<TransformResult> {
    const {
      source,
      input: { dimensions, fps, duration },
      variants,
    } = args;

    if (!source.url) {
      throw new Error('URL source is required for animated preview generation');
    }

    const outputVariant = variants[0];

    try {
      await this.generateAnimatedPreview(
        source.url,
        outputVariant.fileOperations,
        outputVariant.entryPoint,
        dimensions,
        fps || 15,
        duration || 3
      );

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
    }
  }

  private async generateAnimatedPreview(
    inputUrl: string,
    fileOperations: any,
    outputPath: string,
    dimensions?: {
      width?: number;
      height?: number;
      maintainAspectRatio?: boolean;
    },
    fps: number = 30,
    duration: number = 4
  ): Promise<void> {
    const videoFilter = this.buildVideoFilter(dimensions, fps);

    const ffmpeg = new FFmpegCommand()
      .arg('-i', inputUrl)
      .arg('-t', String(duration))
      .arg('-vf', videoFilter)
      .arg('-f', 'gif')
      .arg('pipe:1');

    await ffmpeg.execute(async (stdout) => {
      await fileOperations.write(outputPath, stdout);
    });
  }

  private buildVideoFilter(
    dimensions?: {
      width?: number;
      height?: number;
      maintainAspectRatio?: boolean;
    },
    fps: number = 30
  ): string {
    const filters: string[] = [];

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
      filters.push(scaleFilter);
    }

    filters.push(`fps=${fps}`);

    // Use split and palettegen for better GIF quality
    // This creates a palette from the video and uses it for encoding
    filters.push('split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse');

    return filters.join(',');
  }
}
