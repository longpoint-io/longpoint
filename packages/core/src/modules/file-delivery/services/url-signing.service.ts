import { ConfigService } from '@/modules/common/services';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { InvalidSignature } from '../file-delivery.errors';
import { TransformParams } from '../file-delivery.types';

export interface GenerateSignedUrlOptions extends TransformParams {
  expiresInSeconds?: number;
}

export interface VerifySignatureQuery extends TransformParams {
  sig?: string;
  expires?: number;
}

@Injectable()
export class UrlSigningService {
  private readonly defaultExpirationSeconds = 3600; // 1 hour

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a signed URL for accessing a file through the storage proxy endpoint.
   * @param assetId The asset ID
   * @param filename The filename within the asset
   * @param options Optional parameters for width, height, and expiration
   * @returns A signed URL path with query parameters
   */
  generateSignedUrl(
    assetId: string,
    filename: string,
    options: GenerateSignedUrlOptions = {}
  ): string {
    const {
      w,
      h,
      q,
      f,
      fit,
      expiresInSeconds = this.defaultExpirationSeconds,
    } = options;
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

    // Build the string to sign with parameters in alphabetical order
    const queryParams: string[] = [];
    if (f !== undefined) {
      queryParams.push(`f=${f}`);
    }
    if (fit !== undefined) {
      queryParams.push(`fit=${fit}`);
    }
    if (h !== undefined) {
      queryParams.push(`h=${h}`);
    }
    if (q !== undefined) {
      queryParams.push(`q=${q}`);
    }
    if (w !== undefined) {
      queryParams.push(`w=${w}`);
    }
    queryParams.push(`expires=${expires}`);

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const stringToSign = `${assetId}/${filename}${queryString}`;

    const secret = this.configService.get('storage.storageUrlSecret');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    const urlParams = new URLSearchParams();
    urlParams.set('sig', signature);
    urlParams.set('expires', expires.toString());
    if (w !== undefined) {
      urlParams.set('w', w.toString());
    }
    if (h !== undefined) {
      urlParams.set('h', h.toString());
    }
    if (q !== undefined) {
      urlParams.set('q', q.toString());
    }
    if (f !== undefined) {
      urlParams.set('f', f);
    }
    if (fit !== undefined) {
      urlParams.set('fit', fit);
    }

    const finalPath = `/m/${assetId}/${filename}?${urlParams.toString()}`;
    const url = new URL(finalPath, this.configService.get('server.baseUrl'))
      .href;
    return url;
  }

  /**
   * Verifies the signature and expiration of a signed URL.
   * @param path The path part of the URL (e.g., "{assetId}/{filename}")
   * @param query The query parameters including sig, expires, w, h
   * @throws UnauthorizedException if signature is invalid or URL has expired
   */
  verifySignature(path: string, query: VerifySignatureQuery): void {
    const { sig, expires, w, h, q, f, fit } = query;

    if (!sig || !expires) {
      throw new InvalidSignature();
    }

    const now = Math.floor(Date.now() / 1000);
    if (expires < now) {
      throw new InvalidSignature();
    }

    // Rebuild the string that should have been signed with parameters in alphabetical order
    const queryParams: string[] = [];
    if (f !== undefined) {
      queryParams.push(`f=${f}`);
    }
    if (fit !== undefined) {
      queryParams.push(`fit=${fit}`);
    }
    if (h !== undefined) {
      queryParams.push(`h=${h}`);
    }
    if (q !== undefined) {
      queryParams.push(`q=${q}`);
    }
    if (w !== undefined) {
      queryParams.push(`w=${w}`);
    }
    queryParams.push(`expires=${expires}`);

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const stringToSign = `${path}${queryString}`;

    const secret = this.configService.get('storage.storageUrlSecret');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
    ) {
      throw new InvalidSignature();
    }
  }
}
