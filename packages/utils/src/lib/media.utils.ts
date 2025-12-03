import { SupportedMimeType } from '@longpoint/types';
import { join } from 'path';

type AssetType = 'IMAGE';

/**
 * Parses the mime type into an asset type
 * @param mimeType
 * @returns the asset type
 */
export function mimeTypeToAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }

  throw new Error(`Unsupported media type: ${mimeType}`);
}

export interface GetAssetPathOptions {
  /**
   * The storage unit ID to use in the path
   */
  storageUnitId: string;
  /**
   * The prefix to add to the path (e.g., "units")
   * @default "units"
   * @example
   * ```
   * getAssetPath('123', { storageUnitId: 'unit-abc', prefix: 'units' });
   * // returns 'units/unit-abc/123'
   * ```
   */
  prefix?: string;
  /**
   * The suffix to add to the path
   * @example
   * ```
   * getAssetPath('123', { storageUnitId: 'unit-abc', suffix: 'primary.jpg' });
   * // returns 'units/unit-abc/123/primary.jpg'
   * ```
   */
  suffix?: string;
}

/**
 * Gets the storage path for an asset
 * @param assetId The id of the asset
 * @param options The options for the path, including storageUnitId
 * @returns The path in format: {prefix}/{storageUnitId}/{assetId}/{suffix}
 */
export function getAssetPath(assetId: string, options: GetAssetPathOptions) {
  const { storageUnitId, prefix = 'units', suffix = '' } = options;
  return join(prefix, storageUnitId, assetId, suffix);
}

/**
 * Converts a mimetype to its corresponding file extension.
 * @param mimeType The content type to convert
 * @returns The file extension
 */
export function mimeTypeToExtension(mimeType: SupportedMimeType) {
  switch (mimeType) {
    case SupportedMimeType.JPEG:
      return 'jpeg';
    case SupportedMimeType.PNG:
      return 'png';
    case SupportedMimeType.GIF:
      return 'gif';
    case SupportedMimeType.JPG:
      return 'jpg';
    case SupportedMimeType.WEBP:
      return 'webp';
    default:
      return 'bin';
  }
}

/**
 * Gets the MIME type for a given file extension or format name.
 * @param extensionOrFormat The file extension (e.g., 'jpg', 'png') or format name (e.g., 'jpeg', 'webp')
 * @returns The MIME type
 */
export function getMimeType(extensionOrFormat: string): string {
  const normalized = extensionOrFormat.toLowerCase();
  switch (normalized) {
    case 'webp':
      return 'image/webp';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Determines content type from file extension.
 * @param filename The filename (e.g., 'image.jpg', 'photo.png')
 * @returns The content type MIME type
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return getMimeType(ext);
}
