import { SupportedMimeType } from '@longpoint/types';

type AssetType = 'IMAGE' | 'VIDEO';

/**
 * Parses the mime type into an asset type
 * @param mimeType
 * @returns the asset type
 */
export function mimeTypeToAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  }

  throw new Error(`Unsupported media type: ${mimeType}`);
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
    case SupportedMimeType.MP4:
      return 'mp4';
    case SupportedMimeType.WEBM:
      return 'webm';
    case SupportedMimeType.MOV:
      return 'mov';
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
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
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
