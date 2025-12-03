import { EventPayload } from '../event/event.types';

export const AssetEvents = {
  ASSET_VARIANT_READY: 'asset.variant.ready',
  ASSET_VARIANT_FAILED: 'asset.variant.failed',
  ASSET_READY: 'asset.ready',
  ASSET_DELETED: 'asset.deleted',
} as const;

export type AssetEvents = (typeof AssetEvents)[keyof typeof AssetEvents];

export interface AssetVariantReadyEventPayload extends EventPayload {
  id: string;
  assetId: string;
}

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
  [AssetEvents.ASSET_VARIANT_READY]: AssetVariantReadyEventPayload;
  [AssetEvents.ASSET_VARIANT_FAILED]: AssetVariantFailedEventPayload;
  [AssetEvents.ASSET_READY]: AssetReadyEventPayload;
  [AssetEvents.ASSET_DELETED]: AssetDeletedEventPayload;
}
