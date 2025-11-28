export const ImageFitMode = {
  CONTAIN: 'contain',
  COVER: 'cover',
  FILL: 'fill',
  INSIDE: 'inside',
  OUTSIDE: 'outside',
} as const;

export type ImageFitMode = (typeof ImageFitMode)[keyof typeof ImageFitMode];

export interface TransformParams {
  w?: number;
  h?: number;
  q?: number;
  f?: string;
  fit?: ImageFitMode;
}
