import {
  AssetVariant,
  AssetVariantStatus,
  AssetVariantType,
  Prisma,
} from '@/database';
import { PrismaService } from '@/modules/common/services';
import { EventPublisher } from '@/modules/event';
import { UrlSigningService } from '@/modules/file-delivery';
import { StorageUnitEntity } from '@/modules/storage/entities';
import { Serializable } from '@/shared/types/swagger.types';
import { getAssetVariantPath } from '@/shared/utils/asset.utils';
import { FileOperations } from '@longpoint/devkit';
import { JsonObject, SupportedMimeType } from '@longpoint/types';
import { forwardSlashJoin } from '@longpoint/utils/path';
import { Readable } from 'stream';
import { AssetVariantNotFound } from '../asset.errors';
import { AssetEventKey } from '../asset.events';
import { SelectedAssetVariant } from '../asset.selectors';
import { AssetVariantDto } from '../dtos/containers/asset-variant.dto';

export interface AssetVariantEntityArgs extends SelectedAssetVariant {
  urlSigningService: UrlSigningService;
  storageUnit: StorageUnitEntity;
  prismaService: PrismaService;
  eventPublisher: EventPublisher;
}

export type UpdateAssetVariantArgs = Partial<
  Pick<
    AssetVariant,
    | 'status'
    | 'entryPoint'
    | 'displayName'
    | 'mimeType'
    | 'width'
    | 'height'
    | 'duration'
    | 'metadata'
  >
>;

export class AssetVariantEntity implements Serializable {
  readonly id: string;
  readonly type: AssetVariantType;
  readonly assetId: string;
  private _displayName: string | null;
  private _status: AssetVariantStatus;
  private _entryPoint: string;
  private _mimeType: SupportedMimeType;
  private _width: number | null;
  private _height: number | null;
  private _size: number | null;
  private _duration: number | null;
  private _metadata: JsonObject | null;

  private readonly urlSigningService: UrlSigningService;
  private readonly prismaService: PrismaService;
  private readonly storageUnit: StorageUnitEntity;
  private readonly eventPublisher: EventPublisher;

  constructor(params: AssetVariantEntityArgs) {
    this.id = params.id;
    this.type = params.type;
    this._displayName = params.displayName;
    this._entryPoint = params.entryPoint;
    this._mimeType = params.mimeType as SupportedMimeType;
    this._width = params.width;
    this._height = params.height;
    this._size = params.size;
    this._duration = params.duration;
    this._metadata = params.metadata as JsonObject | null;
    this._status = params.status;
    this.urlSigningService = params.urlSigningService;
    this.assetId = params.assetId;
    this.storageUnit = params.storageUnit;
    this.prismaService = params.prismaService;
    this.eventPublisher = params.eventPublisher;
  }

  async update(data: UpdateAssetVariantArgs) {
    try {
      const updated = await this.prismaService.assetVariant.update({
        where: {
          id: this.id,
        },
        data: {
          status: data.status,
          entryPoint: data.entryPoint,
          mimeType: data.mimeType,
          width: data.width,
          height: data.height,
          displayName: data.displayName,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      });
      this._status = updated.status;
      this._entryPoint = updated.entryPoint;
      this._mimeType = updated.mimeType as SupportedMimeType;
      this._width = updated.width;
      this._height = updated.height;
      this._size = updated.size;
      this._duration = updated.duration;
      this._displayName = updated.displayName;
      this._metadata = updated.metadata as JsonObject | null;

      if (data.status === 'READY') {
        this.eventPublisher.publish(AssetEventKey.ASSET_VARIANT_READY, {
          id: this.id,
          assetId: this.assetId,
        });
      }
      if (data.status === 'FAILED') {
        this.eventPublisher.publish(AssetEventKey.ASSET_VARIANT_FAILED, {
          id: this.id,
          assetId: this.assetId,
        });
      }
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new AssetVariantNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Permanently deletes the asset variant.
   */
  async delete(): Promise<void> {
    try {
      const provider = await this.storageUnit.getProvider();
      await provider.deleteDirectory(
        getAssetVariantPath({
          id: this.id,
          assetId: this.assetId,
          storageUnitId: this.storageUnit.id,
          prefix: this.storageUnit.pathPrefix,
        })
      );
      await this.prismaService.assetVariant.delete({
        where: { id: this.id },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new AssetVariantNotFound(this.id);
      }
      throw e;
    }
  }

  /**
   * Sync the size of the variant from the storage unit
   */
  async syncSize() {
    const provider = await this.storageUnit.getProvider();
    const fileStats = await provider.getPathStats(
      getAssetVariantPath({
        id: this.id,
        assetId: this.assetId,
        entryPoint: this.entryPoint,
        storageUnitId: this.storageUnit.id,
        prefix: this.storageUnit.pathPrefix,
      })
    );
    await this.prismaService.assetVariant.update({
      where: {
        id: this.id,
      },
      data: {
        size: fileStats.size,
      },
    });
    this._size = fileStats.size;
  }

  async getStorageUnitOperations(): Promise<FileOperations> {
    const provider = await this.storageUnit.getProvider();
    const assetVariantPath = getAssetVariantPath({
      id: this.id,
      assetId: this.assetId,
      storageUnitId: this.storageUnit.id,
      prefix: this.storageUnit.pathPrefix,
    });
    return {
      write: async (path: string, readable: Readable) => {
        const fullPath = forwardSlashJoin(assetVariantPath, path);
        await provider.upload(fullPath, readable);
      },
      read: async (path: string) => {
        const fullPath = forwardSlashJoin(assetVariantPath, path);
        return provider.getFileStream(fullPath);
      },
      delete: async (path: string) => {
        throw new Error('Not implemented');
      },
    };
  }

  toDto(): AssetVariantDto {
    return new AssetVariantDto({
      id: this.id,
      type: this.type,
      width: this.width,
      height: this.height,
      size: this.size,
      aspectRatio: this.aspectRatio,
      displayName: this._displayName,
      duration: this.duration,
      metadata: this.metadata as JsonObject | null,
      status: this._status,
      entryPoint: this.entryPoint,
      mimeType: this.mimeType,
      url: this.url,
    });
  }

  get status(): AssetVariantStatus {
    return this._status;
  }

  get displayName(): string | null {
    return this._displayName;
  }

  get width(): number | null {
    return this._width;
  }

  get height(): number | null {
    return this._height;
  }

  get size(): number | null {
    return this._size;
  }

  get aspectRatio(): number | null {
    return this.width && this.height ? this.width / this.height : null;
  }

  get duration(): number | null {
    return this._duration;
  }

  get metadata(): JsonObject | null {
    return this._metadata;
  }

  get entryPoint(): string {
    return this._entryPoint;
  }

  get mimeType(): SupportedMimeType {
    return this._mimeType;
  }

  get url(): string {
    return this.urlSigningService.generateSignedUrl(this.id, this._entryPoint);
  }
}
