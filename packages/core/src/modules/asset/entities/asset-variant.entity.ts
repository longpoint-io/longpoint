import { AssetVariantStatus, AssetVariantType } from '@/database';
import { UrlSigningService } from '@/modules/file-delivery';
import { JsonObject, SupportedMimeType } from '@longpoint/types';
import { SelectedAssetVariant } from '../asset.selectors';

export interface AssetVariantEntityArgs extends SelectedAssetVariant {
  urlSigningService: UrlSigningService;
}

export class AssetVariantEntity {
  readonly id: string;
  readonly type: AssetVariantType;
  readonly mimeType: SupportedMimeType;
  readonly width: number | null;
  readonly height: number | null;
  readonly size: number | null;
  readonly aspectRatio: number | null;
  readonly duration: number | null;
  readonly metadata: JsonObject | null;
  private readonly _status: AssetVariantStatus;

  private readonly urlSigningService: UrlSigningService;

  constructor(params: AssetVariantEntityArgs) {
    this.id = params.id;
    this.type = params.type;
    this.mimeType = params.mimeType as SupportedMimeType;
    this.width = params.width;
    this.height = params.height;
    this.size = params.size;
    this.aspectRatio = params.aspectRatio;
    this.duration = params.duration;
    this.metadata = params.metadata as JsonObject | null;
    this._status = params.status;
    this.urlSigningService = params.urlSigningService;
  }

  get status(): AssetVariantStatus {
    return this._status;
  }
}
