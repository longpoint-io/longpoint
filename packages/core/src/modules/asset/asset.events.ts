import { EventPayload } from '../event/event.types';

export const enum AssetEventKey {
  ASSET_VARIANT_READY = 'asset.variant.ready',
  ASSET_VARIANT_UPDATED = 'asset.variant.updated',
  ASSET_VARIANT_DELETED = 'asset.variant.deleted',
  ASSET_VARIANT_FAILED = 'asset.variant.failed',
  ASSET_READY = 'asset.ready',
  ASSET_DELETED = 'asset.deleted',
}

export interface AssetVariantReadyEventPayload extends EventPayload {
  id: string;
  assetId: string;
}

export type AssetVariantUpdatedEventPayload = AssetVariantReadyEventPayload;
export type AssetVariantDeletedEventPayload = AssetVariantReadyEventPayload;

export type AssetVariantFailedEventPayload = Pick<
  AssetVariantReadyEventPayload,
  'id' | 'assetId'
>;

export interface AssetReadyEventPayload extends EventPayload {
  assetId: string;
}

export interface AssetDeletedEventPayload extends EventPayload {
  assetIds: string[];
}

export interface AssetEventPayloads {
  [AssetEventKey.ASSET_VARIANT_READY]: AssetVariantReadyEventPayload;
  [AssetEventKey.ASSET_VARIANT_UPDATED]: AssetVariantUpdatedEventPayload;
  [AssetEventKey.ASSET_VARIANT_DELETED]: AssetVariantDeletedEventPayload;
  [AssetEventKey.ASSET_VARIANT_FAILED]: AssetVariantFailedEventPayload;
  [AssetEventKey.ASSET_READY]: AssetReadyEventPayload;
  [AssetEventKey.ASSET_DELETED]: AssetDeletedEventPayload;
}
