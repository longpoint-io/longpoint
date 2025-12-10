import { AssetVariant } from '@/database';

export interface GetAssetPathArgs {
  assetId: string;
  storageUnitId: string;
  prefix?: string;
}

export function getAssetPath(args: GetAssetPathArgs) {
  const { assetId, storageUnitId, prefix = '' } = args;
  return [prefix, 'units', storageUnitId, assetId].filter(Boolean).join('/');
}

export interface GetAssetVariantPathArgs
  extends Pick<AssetVariant, 'id' | 'assetId'> {
  storageUnitId: string;
  entryPoint?: string;
  prefix?: string;
}

export function getAssetVariantPath(args: GetAssetVariantPathArgs) {
  const {
    id: variantId,
    assetId,
    entryPoint,
    storageUnitId,
    prefix = '',
  } = args;
  return [prefix, 'units', storageUnitId, assetId, variantId, entryPoint]
    .filter(Boolean)
    .join('/');
}

export interface GetAssetCachePathArgs {
  assetId: string;
  storageUnitId: string;
  fileName: string;
  prefix?: string;
}

export function getAssetCachePath(args: GetAssetCachePathArgs) {
  const { assetId, storageUnitId, fileName, prefix = '' } = args;
  return [prefix, 'units', storageUnitId, assetId, '.cache', fileName]
    .filter(Boolean)
    .join('/');
}
