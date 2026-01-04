/**
 * Generally supported MIME types in Longpoint.
 */
export const LongpointMimeType = {
  JPG: 'image/jpg',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  // SVG: 'image/svg+xml',
  MP4: 'video/mp4',
  WEBM: 'video/webm',
  MOV: 'video/quicktime',
  MKV: 'video/x-matroska',
  /**
   * HLS playlist
   */
  M3U8: 'application/vnd.apple.mpegurl',
  /**
   * MPEG-DASH playlist
   */
  MPD: 'application/dash+xml',
  // OGV: 'video/ogg',
  // PLAIN_TEXT: 'text/plain',
  // HTML: 'text/html',
  // MP3: 'audio/mpeg',
  // WAV: 'audio/wav',
  // OGA: 'audio/ogg',
  // AAC: 'audio/aac',
  // WEBA: 'audio/webm',
} as const;

export type LongpointMimeType =
  (typeof LongpointMimeType)[keyof typeof LongpointMimeType];
