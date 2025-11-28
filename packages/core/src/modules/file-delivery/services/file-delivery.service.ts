import { ConfigService, PrismaService } from '@/modules/common/services';
import { MediaContainerNotFound } from '@/modules/media';
import { StorageUnitService } from '@/modules/storage';
import { StorageProviderEntity } from '@/modules/storage/entities';
import {
  getContentType,
  getMediaContainerPath,
  getMimeType,
} from '@longpoint/utils/media';
import { Injectable, NotFoundException } from '@nestjs/common';
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
    const requestPath = req.path.replace(/^\/m\/?/, '');
    const pathPrefix = this.configService.get('storage.pathPrefix');

    const pathParts = requestPath.split('/').filter(Boolean);

    // Path format: /m/{mediaContainerId}/{filename}
    if (pathParts.length !== 2) {
      throw new InvalidFilePath(requestPath);
    }

    const containerId = pathParts[0];
    const filename = pathParts[1];

    const pathForSignature = `${containerId}/${filename}`;
    this.urlSigningService.verifySignature(pathForSignature, query);

    const container = await this.prismaService.mediaContainer.findUnique({
      where: {
        id: containerId,
      },
      select: {
        storageUnitId: true,
      },
    });

    if (!container) {
      throw new MediaContainerNotFound(containerId);
    }

    const storageUnit = await this.storageUnitService.getStorageUnitById(
      container.storageUnitId
    );

    const provider = await storageUnit.getProvider();

    const originalPath = getMediaContainerPath(containerId, {
      storageUnitId: container.storageUnitId,
      prefix: pathPrefix,
      suffix: filename,
    });

    const hasTransformParams =
      query.w !== undefined ||
      query.h !== undefined ||
      query.q !== undefined ||
      query.f !== undefined ||
      query.fit !== undefined;

    if (!hasTransformParams) {
      try {
        const stream = await provider.getFileStream(originalPath);

        const contentType = getContentType(filename);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        stream.pipe(res);
        return;
      } catch (error) {
        throw new FileNotFound(originalPath);
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

      const recipeHash = this.generateCacheHash(filename, transformParams);

      // Determine output format: normalize jpg to jpeg, default to webp
      const outputFormat = query.f
        ? query.f.toLowerCase() === 'jpg'
          ? 'jpeg'
          : query.f.toLowerCase()
        : 'webp';
      const outputExt = outputFormat;

      const cachePath = await this.getCachePath(
        containerId,
        container.storageUnitId,
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

      const originalBuffer = await provider.getFileContents(originalPath);
      const transformResult = await this.imageTransformService.transform(
        originalBuffer,
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
        const stream = await provider.getFileStream(originalPath);
        const contentType = getContentType(filename);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        stream.pipe(res);
      } catch {
        throw new FileNotFound(originalPath);
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
    containerId: string,
    storageUnitId: string,
    recipeHash: string,
    ext: string
  ) {
    return getMediaContainerPath(containerId, {
      storageUnitId,
      prefix: this.configService.get('storage.pathPrefix'),
      suffix: `.cache/${recipeHash}.${ext}`,
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
}
