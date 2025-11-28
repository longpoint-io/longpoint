import { getMimeType } from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { ImageFitMode } from '../file-delivery.types';

/**
 * Transform options using descriptive property names.
 */
export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: ImageFitMode;
}

export interface TransformResult {
  buffer: Buffer;
  format: string;
  mimeType: string;
}

@Injectable()
export class ImageTransformService {
  /**
   * Transforms an image buffer based on width and height parameters.
   * @param inputBuffer The original image buffer
   * @param options Transform options (width, height, quality, format, fit)
   * @returns The transformed image buffer and metadata
   */
  async transform(
    inputBuffer: Buffer,
    options: TransformOptions
  ): Promise<TransformResult> {
    const { width, height, quality, format, fit } = options;
    let sharpInstance = sharp(inputBuffer);

    const metadata = await sharpInstance.metadata();
    const originalFormat = metadata.format;

    // Normalize format: jpg -> jpeg, use format override if provided
    const normalizedFormat = format
      ? format.toLowerCase() === 'jpg'
        ? 'jpeg'
        : format.toLowerCase()
      : undefined;

    const outputFormat = this.getOutputFormat(originalFormat, normalizedFormat);

    let fitMode: ImageFitMode = 'fill';
    if (fit) {
      fitMode = fit;
    } else {
      // Default behavior: fill when both dimensions, inside when one dimension
      if (width !== undefined && height !== undefined) {
        fitMode = ImageFitMode.FILL;
      } else if (width !== undefined || height !== undefined) {
        fitMode = ImageFitMode.INSIDE;
      }
    }

    if (width !== undefined && height !== undefined) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: fitMode,
      });
    } else if (width !== undefined) {
      sharpInstance = sharpInstance.resize(width, undefined, {
        fit: fitMode,
      });
    } else if (height !== undefined) {
      sharpInstance = sharpInstance.resize(undefined, height, {
        fit: fitMode,
      });
    }

    const buffer = await this.convertToFormat(
      sharpInstance,
      outputFormat,
      quality
    );
    const mimeType = getMimeType(outputFormat);

    return {
      buffer,
      format: outputFormat,
      mimeType,
    };
  }

  /**
   * Determines the output format, preferring WebP for better compression.
   * @param originalFormat The original image format
   * @param formatOverride Optional format override from user parameter
   * @returns The output format to use
   */
  private getOutputFormat(
    originalFormat?: string,
    formatOverride?: string
  ): string {
    if (formatOverride) {
      return formatOverride;
    }
    return 'webp';
  }

  /**
   * Converts the Sharp instance to the specified format.
   * @param sharpInstance The Sharp instance to convert
   * @param format The target format
   * @param quality Optional quality parameter (1-100, applies to JPEG and WebP only)
   * @returns The converted image buffer
   */
  private async convertToFormat(
    sharpInstance: sharp.Sharp,
    format: string,
    quality?: number
  ): Promise<Buffer> {
    const qualityOption = quality !== undefined ? { quality } : undefined;

    switch (format) {
      case 'webp':
        return qualityOption
          ? sharpInstance.webp(qualityOption).toBuffer()
          : sharpInstance.webp().toBuffer();
      case 'jpeg':
        return qualityOption
          ? sharpInstance.jpeg(qualityOption).toBuffer()
          : sharpInstance.jpeg().toBuffer();
      case 'png':
        // PNG doesn't support quality, ignore it
        return sharpInstance.png().toBuffer();
      case 'gif':
        return qualityOption
          ? sharpInstance.webp(qualityOption).toBuffer()
          : sharpInstance.webp().toBuffer();
      default:
        return qualityOption
          ? sharpInstance.webp(qualityOption).toBuffer()
          : sharpInstance.webp().toBuffer();
    }
  }
}
