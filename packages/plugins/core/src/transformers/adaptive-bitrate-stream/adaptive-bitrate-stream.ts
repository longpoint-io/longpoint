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
import {
  FFmpegCommand,
  parseFFmpegError,
  probeVideoInfo,
  VideoInfo,
} from '../../lib/ffmpeg.js';
import { AdaptiveBitrateStreamInput, QualityConfig } from './input.js';
import {
  generateDashMasterManifest,
  generateHlsMasterPlaylist,
  generateQualityDashPlaylist,
  type ResolvedQuality,
  type VariantMapping,
} from './playlist-generator.js';
import { MultiQualitySegmentUploader } from './segment-uploader.js';

interface InternalVariantMapping {
  variant: TransformArgs<AdaptiveBitrateStreamInput>['variants'][0];
  qualityIndex: number;
  playlistType: 'HLS' | 'DASH';
}

/**
 * Generates an adaptive bitrate stream from a source video by generating multiple
 * quality variants and master playlists.
 * @param args - The arguments for the transformer.
 * @returns The handshake result.
 */
export default class AdaptiveBitrateStream extends AssetTransformer {
  constructor(args: AssetTransformerArgs) {
    super(args);
  }

  async handshake(
    args: HandshakeArgs<AdaptiveBitrateStreamInput>
  ): Promise<HandshakeResult> {
    const {
      includeSourceQuality = 'Fallback',
      playlist = 'HLS+DASH',
      qualities = [],
    } = args.input;

    if (!args.source.url) {
      throw new Error('URL source is required for ABR stream generation');
    }

    const sourceInfo = await probeVideoInfo(args.source.url);
    const resolvedQualities = this.resolveQualities(
      qualities,
      sourceInfo,
      includeSourceQuality
    );

    if (resolvedQualities.length === 0) {
      throw new Error(
        'No valid qualities could be determined. Check your quality settings and source video dimensions.'
      );
    }

    const variants: HandshakeResult['variants'] = [];

    const isSingleQualityHlsDash =
      playlist === 'HLS+DASH' && resolvedQualities.length === 1;

    const masterIndexes: number[] = [];
    if (playlist.includes('HLS') && !isSingleQualityHlsDash) {
      masterIndexes.push(variants.length);
      variants.push({
        name: `${args.input.name || 'ABR Stream'} (HLS Master)`,
        entryPoint: 'playlist.m3u8',
        mimeType: LongpointMimeType.M3U8,
        type: 'DERIVATIVE',
      });
    }
    if (playlist.includes('DASH') && !isSingleQualityHlsDash) {
      masterIndexes.push(variants.length);
      variants.push({
        name: `${args.input.name || 'ABR Stream'} (DASH Master)`,
        entryPoint: 'playlist.mpd',
        mimeType: LongpointMimeType.MPD,
        type: 'DERIVATIVE',
      });
    }

    for (const quality of resolvedQualities) {
      if (playlist.includes('HLS')) {
        // Use input name when single quality, otherwise use quality name
        const variantName = isSingleQualityHlsDash
          ? `${args.input.name || 'ABR Stream'} (HLS)`
          : `${quality.name} (HLS)`;
        variants.push({
          name: variantName,
          entryPoint: 'playlist.m3u8',
          mimeType: LongpointMimeType.M3U8,
          type: 'DERIVATIVE',
          parentIndexes: masterIndexes.filter((idx) => {
            return variants[idx].mimeType === LongpointMimeType.M3U8;
          }),
        });
      }
      if (playlist.includes('DASH')) {
        // Use input name when single quality, otherwise use quality name
        const variantName = isSingleQualityHlsDash
          ? `${args.input.name || 'ABR Stream'} (DASH)`
          : `${quality.name} (DASH)`;
        variants.push({
          name: variantName,
          entryPoint: 'playlist.mpd',
          mimeType: LongpointMimeType.MPD,
          type: 'DERIVATIVE',
          parentIndexes: masterIndexes.filter((idx) => {
            return variants[idx].mimeType === LongpointMimeType.MPD;
          }),
        });
      }
    }

    return { variants };
  }

  async transform(
    args: TransformArgs<AdaptiveBitrateStreamInput>
  ): Promise<TransformResult> {
    const {
      source,
      input: {
        qualities = [],
        includeSourceQuality = 'Fallback',
        playlist = 'HLS+DASH',
      },
      variants,
    } = args;

    if (!source.url) {
      throw new Error('URL source is required for ABR stream generation');
    }

    const sourceInfo = await probeVideoInfo(source.url);
    const resolvedQualities = this.resolveQualities(
      qualities,
      sourceInfo,
      includeSourceQuality
    );

    // Calculate master variant count (masters come first in the variants array)
    // When HLS+DASH and only one quality, no master playlists are created
    const isSingleQualityHlsDash =
      playlist === 'HLS+DASH' && resolvedQualities.length === 1;
    const masterCount = isSingleQualityHlsDash
      ? 0
      : (playlist.includes('HLS') ? 1 : 0) +
        (playlist.includes('DASH') ? 1 : 0);
    const masterVariants = variants.slice(0, masterCount);
    const qualityVariants = variants.slice(masterCount);

    const variantMap = this.mapVariantsToQualities(
      qualityVariants,
      resolvedQualities,
      playlist
    );

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'abr-'));

    // Create subdirectories for each quality (named by index for temp processing)
    for (let i = 0; i < resolvedQualities.length; i++) {
      const qualityDir = path.join(tempDir, `quality_${i}`);
      await fs.mkdir(qualityDir, { recursive: true });
    }

    // Only HLS variants get segments uploaded to them
    const hlsVariants = variantMap
      .filter((v) => v.playlistType === 'HLS')
      .map((v) => v.variant);

    const uploader = new MultiQualitySegmentUploader(
      tempDir,
      hlsVariants,
      resolvedQualities.map((_, i) => `quality_${i}`)
    );

    try {
      uploader.setupWatchers();

      const ffmpeg = this.buildMultiQualityFFmpegCommand({
        sourceUrl: source.url,
        qualities: resolvedQualities,
        tempDir,
      });

      await this.executeFFmpeg(ffmpeg);
      await this.waitForSegmentsToComplete(uploader);
      await this.uploadQualityAssets(
        tempDir,
        resolvedQualities,
        variantMap,
        playlist
      );
      await this.uploadMasterPlaylists(
        tempDir,
        resolvedQualities,
        variantMap,
        masterVariants,
        playlist
      );

      return {
        variants: variants.map((v) => ({ id: v.id })),
      };
    } catch (error) {
      return {
        variants: variants.map((v) => ({
          id: v.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })),
      };
    } finally {
      uploader.cleanup();
      await this.cleanupTempDirectory(tempDir);
    }
  }

  private resolveQualities(
    qualities: QualityConfig[],
    sourceInfo: VideoInfo,
    includeSourceQuality: string
  ): ResolvedQuality[] {
    const resolved: ResolvedQuality[] = [];
    let hasValidQuality = false;

    for (const q of qualities) {
      const targetHeight = q.dimensions?.height;
      const targetWidth = q.dimensions?.width;

      const wouldUpscale =
        (targetHeight && targetHeight > sourceInfo.height) ||
        (targetWidth && targetWidth > sourceInfo.width);

      if (wouldUpscale && !q.allowUpscaling) {
        continue;
      }

      hasValidQuality = true;
      const codec = q.codec || 'h264';
      const bitrate =
        q.bitrate ?? this.calculateBitrate(targetHeight, targetWidth, codec);
      resolved.push({
        name: q.name || this.generateQualityName(targetHeight, targetWidth),
        width: targetWidth,
        height: targetHeight,
        bitrate,
        codec,
        isSource: false,
      });
    }

    const shouldIncludeSource =
      includeSourceQuality === 'Always' ||
      (includeSourceQuality === 'Fallback' && !hasValidQuality);

    if (shouldIncludeSource) {
      resolved.push({
        name: 'Source Quality',
        width: sourceInfo.width,
        height: sourceInfo.height,
        bitrate: sourceInfo.bitrate
          ? Math.round(sourceInfo.bitrate / 1000)
          : undefined,
        codec: 'source',
        isSource: true,
      });
    }

    resolved.sort((a, b) => (b.height || 0) - (a.height || 0));

    return resolved;
  }

  /**
   * Calculates an appropriate bitrate based on resolution and codec.
   */
  private calculateBitrate(
    height?: number,
    width?: number,
    codec: string = 'h264'
  ): number {
    // Use height as primary indicator (more standard than width)
    const resolution = height || width || 0;

    // H.265 (HEVC) is ~25-50% more efficient than H.264
    // VP9 is similar to H.265 in efficiency
    // AV1 is ~30% more efficient than VP9
    const codecMultiplier: Record<string, number> = {
      h264: 1.0,
      h265: 0.7, // ~30% reduction from H.264
      hevc: 0.7, // alias for h265
      vp9: 0.7,
      av1: 0.5, // ~50% reduction from H.264
    };

    const multiplier = codecMultiplier[codec.toLowerCase()] || 1.0;

    let baseBitrate: number;

    if (resolution >= 2160) {
      // 4K (2160p)
      baseBitrate = 15000;
    } else if (resolution >= 1440) {
      // 1440p
      baseBitrate = 8000;
    } else if (resolution >= 1080) {
      // 1080p
      baseBitrate = 5000;
    } else if (resolution >= 720) {
      // 720p
      baseBitrate = 2500;
    } else if (resolution >= 480) {
      // 480p
      baseBitrate = 1000;
    } else if (resolution >= 360) {
      // 360p
      baseBitrate = 600;
    } else {
      // 240p or lower
      baseBitrate = 400;
    }

    return Math.round(baseBitrate * multiplier);
  }

  private generateQualityName(height?: number, width?: number): string {
    if (height) return `${height}p`;
    if (width) return `${width}w`;
    return 'default';
  }

  private mapVariantsToQualities(
    variants: TransformArgs<AdaptiveBitrateStreamInput>['variants'],
    qualities: ResolvedQuality[],
    playlist: string
  ): InternalVariantMapping[] {
    const mappings: InternalVariantMapping[] = [];
    const hasHls = playlist.includes('HLS');
    const hasDash = playlist.includes('DASH');
    let variantIndex = 0;

    for (
      let qualityIndex = 0;
      qualityIndex < qualities.length;
      qualityIndex++
    ) {
      if (hasHls) {
        mappings.push({
          variant: variants[variantIndex],
          qualityIndex,
          playlistType: 'HLS',
        });
        variantIndex++;
      }
      if (hasDash) {
        mappings.push({
          variant: variants[variantIndex],
          qualityIndex,
          playlistType: 'DASH',
        });
        variantIndex++;
      }
    }

    return mappings;
  }

  private buildMultiQualityFFmpegCommand({
    sourceUrl,
    qualities,
    tempDir,
  }: {
    sourceUrl: string;
    qualities: ResolvedQuality[];
    tempDir: string;
  }): FFmpegCommand {
    const ffmpeg = new FFmpegCommand().arg('-i', sourceUrl);

    if (qualities.length === 1) {
      return this.buildSingleQualityCommand(ffmpeg, qualities[0], tempDir, 0);
    }

    const filterParts: string[] = [];
    const splitOutputs = qualities.map((_, i) => `[v${i}]`).join('');
    filterParts.push(`[0:v]split=${qualities.length}${splitOutputs}`);

    for (let i = 0; i < qualities.length; i++) {
      const q = qualities[i];
      const scaleFilter = this.buildQualityScaleFilter(q);
      filterParts.push(`[v${i}]${scaleFilter}[out${i}]`);
    }

    ffmpeg.arg('-filter_complex', filterParts.join(';'));

    for (let i = 0; i < qualities.length; i++) {
      const q = qualities[i];
      const qualityDir = path.join(tempDir, `quality_${i}`);

      ffmpeg.arg('-map', `[out${i}]`).arg('-map', '0:a?');

      this.addCodecOptions(ffmpeg, q);
      this.addHlsOutputOptions(ffmpeg, qualityDir);
    }

    return ffmpeg;
  }

  private buildSingleQualityCommand(
    ffmpeg: FFmpegCommand,
    quality: ResolvedQuality,
    tempDir: string,
    index: number
  ): FFmpegCommand {
    const qualityDir = path.join(tempDir, `quality_${index}`);
    const scaleFilter = this.buildQualityScaleFilter(quality);

    ffmpeg.arg('-vf', scaleFilter);
    this.addCodecOptions(ffmpeg, quality);
    this.addHlsOutputOptions(ffmpeg, qualityDir);

    return ffmpeg;
  }

  private buildQualityScaleFilter(quality: ResolvedQuality): string {
    if (quality.isSource) {
      return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    }

    if (quality.width && quality.height) {
      const w = this.ensureEven(quality.width);
      const h = this.ensureEven(quality.height);
      return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
    }

    if (quality.height) {
      return `scale=-2:${this.ensureEven(quality.height)}`;
    }

    if (quality.width) {
      return `scale=${this.ensureEven(quality.width)}:-2`;
    }

    return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  }

  private addCodecOptions(
    ffmpeg: FFmpegCommand,
    quality: ResolvedQuality
  ): void {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
      vp9: 'libvpx-vp9',
      av1: 'libaom-av1',
      source: 'libx264',
    };

    const encoder = codecMap[quality.codec] || 'libx264';
    ffmpeg.arg('-c:v', encoder).arg('-preset', 'fast');

    if (quality.bitrate) {
      ffmpeg.arg('-b:v', `${quality.bitrate}k`);
    }

    ffmpeg.arg('-c:a', 'aac').arg('-b:a', '128k');
  }

  private addHlsOutputOptions(ffmpeg: FFmpegCommand, qualityDir: string): void {
    const playlistPath = path.join(qualityDir, 'playlist.m3u8');

    ffmpeg
      .arg('-f', 'hls')
      .arg('-hls_time', '6')
      .arg('-hls_list_size', '0')
      .arg('-hls_segment_type', 'fmp4')
      .arg('-hls_fmp4_init_filename', 'init.mp4')
      .arg('-hls_segment_filename', path.join(qualityDir, 'segment_%03d.m4s'))
      .arg(playlistPath);
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
        return `Video dimensions (${width}x${height}) must be divisible by 2 for encoding.`;
      }
      return `Video dimensions must be divisible by 2 for encoding. ${parsedError}`;
    }

    if (
      parsedError.toLowerCase().includes('error while opening encoder') ||
      parsedError.toLowerCase().includes('could not open encoder')
    ) {
      return `Failed to initialize video encoder: ${parsedError}`;
    }

    if (parsedError.toLowerCase().includes('conversion failed')) {
      return `Video conversion failed: ${parsedError}`;
    }

    if (parsedError.length === 0) {
      return `FFmpeg exited with code ${code}. The video may be in an unsupported format.`;
    }

    return parsedError;
  }

  private async waitForSegmentsToComplete(
    uploader: MultiQualitySegmentUploader
  ): Promise<void> {
    await uploader.waitForCompletion();
    await uploader.queueRemainingSegments();
    await uploader.uploadRemainingSegments();
  }

  private async uploadQualityAssets(
    tempDir: string,
    qualities: ResolvedQuality[],
    variantMap: InternalVariantMapping[],
    playlist: string
  ): Promise<void> {
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const qualityDir = path.join(tempDir, `quality_${i}`);

      const hlsMapping = variantMap.find(
        (m) => m.qualityIndex === i && m.playlistType === 'HLS'
      );
      const dashMapping = variantMap.find(
        (m) => m.qualityIndex === i && m.playlistType === 'DASH'
      );

      // Upload init.mp4 to HLS variant (segments are colocated with HLS only)
      if (hlsMapping) {
        const initPath = path.join(qualityDir, 'init.mp4');
        try {
          await fs.access(initPath);
          const initStream = createReadStream(initPath);
          await hlsMapping.variant.fileOperations.write('init.mp4', initStream);
        } catch {
          // init.mp4 may not exist for some configurations
        }

        const playlistPath = path.join(qualityDir, 'playlist.m3u8');
        let hlsContent = await fs.readFile(playlistPath, 'utf-8');
        hlsContent = hlsContent.replace(
          /^(segment_\d+\.m4s)$/gm,
          'segments/$1'
        );

        const hlsPath = path.join(qualityDir, 'hls_modified.m3u8');
        await fs.writeFile(hlsPath, hlsContent, 'utf-8');
        const hlsStream = createReadStream(hlsPath);
        await hlsMapping.variant.fileOperations.write(
          'playlist.m3u8',
          hlsStream
        );
      }

      if (dashMapping && hlsMapping) {
        const hlsPlaylistPath = path.join(qualityDir, 'playlist.m3u8');
        let hlsContent = '';
        try {
          hlsContent = await fs.readFile(hlsPlaylistPath, 'utf-8');
        } catch {
          // HLS playlist may not exist yet
        }

        const dashContent = generateQualityDashPlaylist(
          quality,
          hlsMapping.variant.id,
          hlsContent
        );
        const dashPath = path.join(qualityDir, 'playlist.mpd');
        await fs.writeFile(dashPath, dashContent, 'utf-8');
        const dashStream = createReadStream(dashPath);
        await dashMapping.variant.fileOperations.write(
          'playlist.mpd',
          dashStream
        );
      }
    }
  }

  private async uploadMasterPlaylists(
    tempDir: string,
    qualities: ResolvedQuality[],
    variantMap: InternalVariantMapping[],
    masterVariants: TransformArgs<AdaptiveBitrateStreamInput>['variants'],
    playlist: string
  ): Promise<void> {
    for (const variant of masterVariants) {
      if (variant.mimeType === LongpointMimeType.M3U8) {
        const hlsMappings: VariantMapping[] = variantMap
          .filter((m) => m.playlistType === 'HLS')
          .map((m) => ({
            variant: { id: m.variant.id },
            qualityIndex: m.qualityIndex,
            playlistType: m.playlistType,
          }));
        const hlsMaster = generateHlsMasterPlaylist(qualities, hlsMappings);
        const masterPath = path.join(tempDir, 'master.m3u8');
        await fs.writeFile(masterPath, hlsMaster, 'utf-8');
        const masterStream = createReadStream(masterPath);
        await variant.fileOperations.write('playlist.m3u8', masterStream);
      } else if (variant.mimeType === LongpointMimeType.MPD) {
        // Read HLS playlists to get segment information for master manifest
        const hlsPlaylistContents: Map<number, string> = new Map();
        for (let i = 0; i < qualities.length; i++) {
          const qualityDir = path.join(tempDir, `quality_${i}`);
          const hlsPlaylistPath = path.join(qualityDir, 'playlist.m3u8');
          try {
            const hlsContent = await fs.readFile(hlsPlaylistPath, 'utf-8');
            hlsPlaylistContents.set(i, hlsContent);
          } catch {
            // HLS playlist may not exist
          }
        }

        const dashMappings: VariantMapping[] = variantMap.map((m) => ({
          variant: { id: m.variant.id },
          qualityIndex: m.qualityIndex,
          playlistType: m.playlistType,
        }));
        const dashManifest = generateDashMasterManifest(
          qualities,
          dashMappings,
          hlsPlaylistContents
        );
        const manifestPath = path.join(tempDir, 'manifest.mpd');
        await fs.writeFile(manifestPath, dashManifest, 'utf-8');
        const manifestStream = createReadStream(manifestPath);
        await variant.fileOperations.write('playlist.mpd', manifestStream);
      }
    }
  }

  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }

  private ensureEven(n: number): number {
    return n % 2 === 0 ? n : n - 1;
  }
}
