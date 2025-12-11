import {
  ClassificationProvider,
  ClassifyArgs,
  ClassifyResult,
  LongpointPluginError,
} from '@longpoint/devkit';
import { FFprobeCommand } from '../lib/ffmpeg.js';

export default class MetadataExtractor extends ClassificationProvider {
  async classify(args: ClassifyArgs): Promise<ClassifyResult> {
    const { source } = args;

    if (!source.url) {
      throw new LongpointPluginError('No source URL provided');
    }

    const ffprobe = new FFprobeCommand()
      .arg('-v', 'quiet')
      .arg('-print_format', 'json')
      .arg('-show_format')
      .arg('-show_streams')
      .arg('-i', source.url);

    const output = JSON.parse(await ffprobe.executeAndReturnOutput());
    const mediaType = source.mimeType.split('/')[0];

    if (mediaType === 'video') {
      return this.extractVideoMetadata(output);
    }

    if (mediaType === 'audio') {
      return this.extractAudioMetadata(output);
    }

    if (mediaType === 'image') {
      return this.extractImageMetadata(output);
    }

    throw new LongpointPluginError(
      `Unsupported media type: ${source.mimeType}`
    );
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

  private extractImageMetadata(output: any): ClassifyResult {
    const imageStream = output.streams.find(
      (stream: any) => stream.codec_type === 'image'
    );
    if (!imageStream) {
      return {};
    }

    const result: ClassifyResult = {};

    if (imageStream.width) {
      result.width = parseInt(imageStream.width as string);
    }
    if (imageStream.height) {
      result.height = parseInt(imageStream.height as string);
    }

    return result;
  }
}
