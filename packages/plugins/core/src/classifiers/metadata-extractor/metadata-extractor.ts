import {
  Classifier,
  ClassifyArgs,
  ClassifyResult,
  LongpointPluginError,
} from '@longpoint/devkit';
import sharp from 'sharp';
import { FFprobeCommand } from '../../lib/ffmpeg.js';

export default class MetadataExtractor extends Classifier {
  async classify(args: ClassifyArgs): Promise<ClassifyResult> {
    const {
      source: { url, mimeType },
    } = args;

    if (!url) {
      throw new LongpointPluginError('No source URL provided');
    }

    if (mimeType.startsWith('image/')) {
      return this.extractImageMetadata(url);
    }

    const ffprobe = new FFprobeCommand()
      .arg('-v', 'quiet')
      .arg('-print_format', 'json')
      .arg('-show_format')
      .arg('-show_streams')
      .arg('-i', url);

    const output = JSON.parse(await ffprobe.executeAndReturnOutput());
    const mediaType = mimeType.split('/')[0];

    if (mediaType === 'video') {
      return this.extractVideoMetadata(output);
    }

    if (mediaType === 'audio') {
      return this.extractAudioMetadata(output);
    }

    throw new LongpointPluginError(`Unsupported media type: ${mimeType}`);
  }

  private extractVideoMetadata(output: any): ClassifyResult {
    const videoStream = output.streams.find(
      (stream: any) => stream.codec_type === 'video'
    );
    if (!videoStream) {
      return {};
    }

    const result: ClassifyResult = {};

    if (videoStream.width) {
      result.width = parseInt(videoStream.width as string);
    }
    if (videoStream.height) {
      result.height = parseInt(videoStream.height as string);
    }
    if (videoStream.duration) {
      result.duration = parseFloat(videoStream.duration as string);
    }

    result.codec = videoStream.codec_name;

    return result;
  }

  private extractAudioMetadata(output: any): ClassifyResult {
    const audioStream = output.streams.find(
      (stream: any) => stream.codec_type === 'audio'
    );
    if (!audioStream) {
      return {};
    }

    const result: ClassifyResult = {};

    if (audioStream.duration) {
      result.duration = parseFloat(audioStream.duration as string);
    }

    return result;
  }

  private async extractImageMetadata(url: string): Promise<ClassifyResult> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const metadata = await sharp(buffer).metadata();

    const result: ClassifyResult = {
      width: metadata.width,
      height: metadata.height,
    };

    return result;
  }
}
