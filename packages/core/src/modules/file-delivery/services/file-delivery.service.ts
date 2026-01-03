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

    const signPath = (filePath: string) => {
      return this.urlSigningService.generateSignedUrl(
        assetVariantId,
        filePath.trim(),
        { expiresInSeconds }
      );
    };

    let result = playlistContent;

    // Sign the init segment in #EXT-X-MAP directive (fMP4)
    result = result.replace(
      /#EXT-X-MAP:URI="([^"]+)"/g,
      (match, initPath) => `#EXT-X-MAP:URI="${signPath(initPath)}"`
    );

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
}
