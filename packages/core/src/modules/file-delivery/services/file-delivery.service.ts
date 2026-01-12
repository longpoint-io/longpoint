import { AssetVariantNotFound } from '@/modules/asset/asset.errors';
import { ConfigService, PrismaService } from '@/modules/common/services';
import { StorageUnitService } from '@/modules/storage';
import { StorageProviderEntity } from '@/modules/storage/entities';
import { BaseError } from '@/shared/errors';
import {
  getAssetCachePath,
  getAssetVariantPath,
} from '@/shared/utils/asset.utils';
import { LongpointMimeType } from '@longpoint/devkit';
import { ErrorCode } from '@longpoint/types';
import { getMimeType } from '@longpoint/utils/media';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { SignedUrlParamsDto } from '../dtos';
import { FileNotFound, InvalidFilePath } from '../file-delivery.errors';
import { TransformParams } from '../file-delivery.types';
import { ImageTransformService } from './image-transform.service';
import { UrlSigningService } from './url-signing.service';

@Injectable()
export class FileDeliveryService {
  constructor(
    private readonly storageUnitService: StorageUnitService,
    private readonly imageTransformService: ImageTransformService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly urlSigningService: UrlSigningService
  ) {}

  async serveFile(req: Request, res: Response, query: SignedUrlParamsDto) {
    const requestPath = req.path.replace(/^\/v\/?/, '');
    const pathPrefix = this.configService.get('storage.pathPrefix');
    const pathParts = requestPath.split('/').filter(Boolean);

    // Path format: /v/{assetVariantId}/{entryPoint}
    if (pathParts.length < 2) {
      throw new InvalidFilePath(requestPath);
    }

    const assetVariantId = pathParts[0];
    const entryPoint = pathParts.slice(1).join('/');
    const pathForSignature = `${assetVariantId}/${entryPoint}`;
    this.urlSigningService.verifySignature(pathForSignature, query);

    const assetVariant = await this.prismaService.assetVariant.findUnique({
      where: {
        id: assetVariantId,
      },
      select: {
        mimeType: true,
        size: true,
        asset: {
          select: {
            id: true,
            storageUnitId: true,
          },
        },
      },
    });

    if (!assetVariant) {
      throw new AssetVariantNotFound(assetVariantId);
    }

    const storageUnit = await this.storageUnitService.getStorageUnitById(
      assetVariant.asset.storageUnitId
    );

    const provider = await storageUnit.getProvider();

    const variantEntryPointPath = getAssetVariantPath({
      prefix: pathPrefix,
      assetId: assetVariant.asset.id,
      id: assetVariantId,
      entryPoint,
      storageUnitId: assetVariant.asset.storageUnitId,
    });

    const hasTransformParams =
      query.w !== undefined ||
      query.h !== undefined ||
      query.q !== undefined ||
      query.f !== undefined ||
      query.fit !== undefined;

    if (!hasTransformParams) {
      // Handle HLS playlists
      if (
        assetVariant.mimeType === LongpointMimeType.M3U8 &&
        entryPoint.endsWith('.m3u8')
      ) {
        return this.serveHlsPlaylist(
          req,
          res,
          assetVariantId,
          variantEntryPointPath,
          provider,
          assetVariant.mimeType,
          query
        );
      }

      // Handle DASH playlists
      if (
        assetVariant.mimeType === LongpointMimeType.MPD &&
        entryPoint.endsWith('.mpd')
      ) {
        return this.serveDashPlaylist(
          req,
          res,
          assetVariantId,
          variantEntryPointPath,
          provider,
          assetVariant.mimeType,
          query
        );
      }

      try {
        const range = req.headers.range;

        if (range) {
          if (!assetVariant.size) {
            throw new BaseError(
              ErrorCode.INVALID_INPUT,
              'Cannot serve file with an undetermined size',
              HttpStatus.BAD_REQUEST
            );
          }

          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : assetVariant.size - 1;
          const chunkSize = end - start + 1;

          const stream = await provider.getFileStream(variantEntryPointPath, {
            start,
            end,
          });

          res.status(HttpStatus.PARTIAL_CONTENT);
          res.setHeader(
            'Content-Range',
            `bytes ${start}-${end}/${assetVariant.size}`
          );
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Type', assetVariant.mimeType);
          res.setHeader('Content-Length', chunkSize.toString());
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          stream.pipe(res);
        } else {
          const stream = await provider.getFileStream(variantEntryPointPath);
          res.setHeader('Content-Type', assetVariant.mimeType);
          if (assetVariant.size) {
            res.setHeader('Content-Length', assetVariant.size.toString());
            res.setHeader('Accept-Ranges', 'bytes');
          }
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          stream.pipe(res);
        }
        return;
      } catch (error) {
        throw new FileNotFound(variantEntryPointPath);
      }
    }

    try {
      const transformParams: TransformParams = {
        w: query.w,
        h: query.h,
        q: query.q,
        f: query.f,
        fit: query.fit,
      };

      const recipeHash = this.generateCacheHash(entryPoint, transformParams);

      // Determine output format: normalize jpg to jpeg, default to webp
      const outputFormat = query.f
        ? query.f.toLowerCase() === 'jpg'
          ? 'jpeg'
          : query.f.toLowerCase()
        : 'webp';
      const outputExt = outputFormat;

      const cachePath = await this.getCachePath(
        assetVariant.asset.id,
        assetVariant.asset.storageUnitId,
        recipeHash,
        outputExt
      );

      const cacheExists = await this.checkCacheExists(provider, cachePath);

      if (cacheExists) {
        const cachedStream = await provider.getFileStream(cachePath);
        res.setHeader('Content-Type', getMimeType(outputExt));
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        cachedStream.pipe(res);
        return;
      }

      const variantBuffer = await provider.getFileContents(
        variantEntryPointPath
      );
      const transformResult = await this.imageTransformService.transform(
        variantBuffer,
        {
          width: query.w,
          height: query.h,
          quality: query.q,
          format: query.f,
          fit: query.fit,
        }
      );

      await this.writeCache(provider, cachePath, transformResult.buffer);

      res.setHeader('Content-Type', transformResult.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(transformResult.buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // If transformation fails, try to serve original
      try {
        const stream = await provider.getFileStream(variantEntryPointPath);
        res.setHeader('Content-Type', assetVariant.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        stream.pipe(res);
      } catch {
        throw new FileNotFound(variantEntryPointPath);
      }
    }
  }

  private normalizeTransformParams(params: TransformParams) {
    const entries: string[] = [];

    if (params.f !== undefined) {
      entries.push(`f:${params.f}`);
    }
    if (params.fit !== undefined) {
      entries.push(`fit:${params.fit}`);
    }
    if (params.h !== undefined) {
      entries.push(`h:${params.h}`);
    }
    if (params.q !== undefined) {
      entries.push(`q:${params.q}`);
    }
    if (params.w !== undefined) {
      entries.push(`w:${params.w}`);
    }

    entries.sort();

    return entries.join(',');
  }

  private generateCacheHash(fileName: string, params: TransformParams) {
    const normalized = this.normalizeTransformParams(params);
    const hash = crypto
      .createHash('sha256')
      .update(`${fileName}-${normalized}`)
      .digest('hex');
    return hash.substring(0, 16);
  }

  private async getCachePath(
    assetId: string,
    storageUnitId: string,
    recipeHash: string,
    ext: string
  ) {
    return getAssetCachePath({
      assetId,
      storageUnitId,
      prefix: this.configService.get('storage.pathPrefix'),
      fileName: `${recipeHash}.${ext}`,
    });
  }

  private checkCacheExists(provider: StorageProviderEntity, cachePath: string) {
    return provider.exists(cachePath);
  }

  private writeCache(
    provider: StorageProviderEntity,
    cachePath: string,
    buffer: Buffer
  ) {
    return provider.upload(cachePath, buffer);
  }

  /**
   * Serves an HLS playlist with signed URLs for all segment references.
   * Reads the playlist, replaces segment file references with signed URLs,
   * and serves the modified playlist.
   */
  private async serveHlsPlaylist(
    req: Request,
    res: Response,
    assetVariantId: string,
    playlistPath: string,
    provider: StorageProviderEntity,
    mimeType: string,
    query: SignedUrlParamsDto
  ) {
    try {
      const playlistBuffer = await provider.getFileContents(playlistPath);
      let playlistContent = playlistBuffer.toString('utf-8');

      const processedContent = this.processHlsPlaylist(
        playlistContent,
        assetVariantId,
        query.expires
      );

      res.setHeader('Content-Type', mimeType);
      // HLS playlists should have short cache time to allow player to refresh and get updated signed URLs
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(Buffer.from(processedContent, 'utf-8'));
    } catch (error) {
      throw new FileNotFound(playlistPath);
    }
  }

  /**
   * Processes an HLS playlist by replacing segment file references with signed URLs.
   * Handles both fMP4 (.m4s segments + init.mp4) and legacy TS (.ts) segments.
   * Also resolves relative paths to other variants (e.g., "../variant-id/playlist.m3u8").
   * @param playlistContent The raw playlist content
   * @param assetVariantId The asset variant ID for generating signed URLs
   * @param playlistExpires The expiration time from the playlist request (optional)
   * @returns The processed playlist with signed segment URLs
   */
  private processHlsPlaylist(
    playlistContent: string,
    assetVariantId: string,
    playlistExpires?: number
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = playlistExpires
      ? Math.max(0, playlistExpires - now)
      : undefined;

    const signPath = (filePath: string, variantId: string = assetVariantId) => {
      return this.urlSigningService.generateSignedUrl(
        variantId,
        filePath.trim(),
        { expiresInSeconds }
      );
    };

    let result = playlistContent;

    // Resolve relative paths to other variants (e.g., "../variant-id/playlist.m3u8")
    result = result.replace(
      /^(?!https?:\/\/)(\.\.\/[^\/\s]+\/[^\s]+)$/gm,
      (_, relativePath) => {
        // Extract variant ID and file path from "../variant-id/path"
        const match = relativePath.match(/^\.\.\/([^\/]+)\/(.+)$/);
        if (match) {
          const [, targetVariantId, filePath] = match;
          return signPath(filePath, targetVariantId);
        }
        return relativePath;
      }
    );

    // Sign the init segment in #EXT-X-MAP directive (fMP4)
    result = result.replace(/#EXT-X-MAP:URI="([^"]+)"/g, (match, initPath) => {
      // Check if it's a relative path to another variant
      if (initPath.startsWith('../')) {
        const match = initPath.match(/^\.\.\/([^\/]+)\/(.+)$/);
        if (match) {
          const [, targetVariantId, filePath] = match;
          return `#EXT-X-MAP:URI="${signPath(filePath, targetVariantId)}"`;
        }
      }
      return `#EXT-X-MAP:URI="${signPath(initPath)}"`;
    });

    // Replace fMP4 segment references (.m4s)
    result = result.replace(
      /^(?!https?:\/\/)([^#\s].*\.m4s)$/gm,
      (_, segmentPath) => signPath(segmentPath)
    );

    // Replace legacy TS segment references (.ts) for backwards compatibility
    result = result.replace(
      /^(?!https?:\/\/)([^#\s].*\.ts)$/gm,
      (_, segmentPath) => signPath(segmentPath)
    );

    // Ensure the result ends with a newline (HLS spec requirement)
    return result.endsWith('\n') ? result : result + '\n';
  }

  /**
   * Serves a DASH playlist with signed URLs for all segment references.
   * Reads the playlist, replaces segment file references with signed URLs,
   * and serves the modified playlist.
   */
  private async serveDashPlaylist(
    req: Request,
    res: Response,
    assetVariantId: string,
    playlistPath: string,
    provider: StorageProviderEntity,
    mimeType: string,
    query: SignedUrlParamsDto
  ) {
    try {
      const playlistBuffer = await provider.getFileContents(playlistPath);
      let playlistContent = playlistBuffer.toString('utf-8');

      const processedContent = this.processDashPlaylist(
        playlistContent,
        assetVariantId,
        query.expires
      );

      res.setHeader('Content-Type', mimeType);
      // DASH playlists should have short cache time to allow player to refresh and get updated signed URLs
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(Buffer.from(processedContent, 'utf-8'));
    } catch (error) {
      throw new FileNotFound(playlistPath);
    }
  }

  /**
   * Processes a DASH playlist by replacing segment file references with signed URLs.
   * Handles SegmentTemplate media and initialization attributes, and resolves relative paths.
   * Note: For media templates with $Number$ variables, we resolve the base path but keep
   * the template structure. Individual segments will be signed when requested.
   * @param playlistContent The raw playlist content
   * @param assetVariantId The asset variant ID for generating signed URLs
   * @param playlistExpires The expiration time from the playlist request (optional)
   * @returns The processed playlist with signed segment URLs
   */
  private processDashPlaylist(
    playlistContent: string,
    assetVariantId: string,
    playlistExpires?: number
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = playlistExpires
      ? Math.max(0, playlistExpires - now)
      : undefined;

    const resolveRelativePath = (
      relativePath: string,
      currentVariantId: string
    ): { variantId: string; filePath: string } | null => {
      const pathMatch = relativePath.match(/^\.\.\/([^\/]+)\/(.+)$/);
      if (pathMatch) {
        const [, targetVariantId, filePath] = pathMatch;
        return { variantId: targetVariantId, filePath };
      }
      // Not a relative path to another variant, use current variant
      if (relativePath.startsWith('./') || !relativePath.startsWith('../')) {
        return { variantId: currentVariantId, filePath: relativePath };
      }
      return null;
    };

    const signPath = (filePath: string, variantId: string = assetVariantId) => {
      return this.urlSigningService.generateSignedUrl(
        variantId,
        filePath.trim(),
        { expiresInSeconds }
      );
    };

    let result = playlistContent;
    const baseUrl = this.configService.get('server.baseUrl');

    // Helper to sign and escape URLs for XML
    const signAndEscapePath = (
      filePath: string,
      variantId: string = assetVariantId
    ) => {
      const url = this.urlSigningService.generateSignedUrl(
        variantId,
        filePath.trim(),
        { expiresInSeconds }
      );
      // Escape XML special characters in URLs (especially & in query parameters)
      return url.replace(/&/g, '&amp;');
    };

    // Resolve relative paths in SegmentList SegmentURL media attribute
    // Pattern: <SegmentURL media="../variant-id/segments/segment_000.m4s" duration="8342"/>
    result = result.replace(
      /<SegmentURL\s+media="(\.\.\/[^\/]+\/[^"]+)"([^>]*\/>)/g,
      (match, mediaPath, restOfTag) => {
        const resolved = resolveRelativePath(mediaPath, assetVariantId);
        if (resolved) {
          // Sign the segment URL directly, preserving other attributes like duration
          return `<SegmentURL media="${signAndEscapePath(
            resolved.filePath,
            resolved.variantId
          )}"${restOfTag}`;
        }
        return match;
      }
    );

    // Resolve relative paths in SegmentList Initialization sourceURL
    // Pattern: <Initialization sourceURL="../variant-id/init.mp4"/>
    result = result.replace(
      /<Initialization\s+sourceURL="(\.\.\/[^\/]+\/[^"]+)"/g,
      (match, initPath) => {
        const resolved = resolveRelativePath(initPath, assetVariantId);
        if (resolved) {
          return `<Initialization sourceURL="${signAndEscapePath(
            resolved.filePath,
            resolved.variantId
          )}"`;
        }
        return match;
      }
    );

    // Resolve relative paths in SegmentTemplate media attribute (fallback for templates)
    // Pattern: media="../variant-id/segments/segment_$Number%03d$.m4s"
    // Convert to full URL format: http://baseurl/v/variant-id/segments/segment_$Number%03d$.m4s
    // Note: Templates with $Number$ can't be pre-signed, but the full URL structure is needed
    result = result.replace(
      /media="(\.\.\/[^\/]+\/[^"]+)"/g,
      (match, mediaPath) => {
        const resolved = resolveRelativePath(mediaPath, assetVariantId);
        if (resolved) {
          // Convert to full URL format
          return `media="${baseUrl}/v/${resolved.variantId}/${resolved.filePath}"`;
        }
        return match;
      }
    );

    // Resolve relative paths in SegmentTemplate initialization attribute
    // Pattern: initialization="../variant-id/init.mp4"
    result = result.replace(
      /initialization="(\.\.\/[^\/]+\/[^"]+)"/g,
      (match, initPath) => {
        const resolved = resolveRelativePath(initPath, assetVariantId);
        if (resolved) {
          // Initialization is a static path, so we can sign it directly
          // Use signAndEscapePath if it exists in scope, otherwise use signPath
          const url = this.urlSigningService.generateSignedUrl(
            resolved.variantId,
            resolved.filePath.trim(),
            { expiresInSeconds }
          );
          return `initialization="${url.replace(/&/g, '&amp;')}"`;
        }
        return match;
      }
    );

    // Resolve relative paths in existing BaseURL elements (if used)
    result = result.replace(
      /<BaseURL>(\.\.\/[^\/]+\/[^<]+)<\/BaseURL>/g,
      (match, baseUrlPath) => {
        const resolved = resolveRelativePath(baseUrlPath, assetVariantId);
        if (resolved) {
          return `<BaseURL>${baseUrl}/v/${resolved.variantId}/${resolved.filePath}</BaseURL>`;
        }
        return match;
      }
    );

    // Handle non-relative paths (same variant) in SegmentTemplate initialization
    result = result.replace(
      /initialization="([^"\/\.][^"]*\.mp4[^"]*)"/g,
      (match, initPath) => {
        // Only process if not already a full URL
        if (
          !initPath.startsWith('http://') &&
          !initPath.startsWith('https://')
        ) {
          return `initialization="${signPath(initPath)}"`;
        }
        return match;
      }
    );

    return result;
  }
}
