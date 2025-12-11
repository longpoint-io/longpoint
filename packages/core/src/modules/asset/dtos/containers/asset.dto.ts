import {
  AssetStatus,
  AssetType,
  AssetVariantStatus,
  AssetVariantType,
} from '@/database';
import { type SelectedAsset } from '@/modules/asset/asset.selectors';
import { CollectionReferenceDto } from '@/modules/collection';
import { SupportedMimeType } from '@longpoint/types';
import { IsValidAssetName } from '@longpoint/validations';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { AssetVariantDto } from './asset-variant.dto';

export type AssetParams = Omit<SelectedAsset, 'variants'> & {
  totalSize: number;
  original: AssetVariantDto;
  derivatives: AssetVariantDto[];
  thumbnails: AssetVariantDto[];
  collections: CollectionReferenceDto[];
};

@ApiSchema({ name: 'Asset' })
export class AssetDto {
  @ApiProperty({
    description: 'The ID of the asset',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  id: string;

  @IsValidAssetName()
  @ApiProperty({
    description: 'A descriptive name for the underlying asset',
    example: 'Blissful Fields',
  })
  name: string;

  @ApiProperty({
    description: 'The primary asset type.',
    example: AssetType.IMAGE,
    enum: AssetType,
  })
  type: AssetType;

  @ApiProperty({
    description: 'The status of the asset',
    example: AssetStatus.WAITING_FOR_UPLOAD,
    enum: AssetStatus,
  })
  status: AssetStatus;

  @ApiProperty({
    description: 'When the asset was created',
    example: '2025-12-05T17:29:36.504Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the asset was last updated',
    example: '2025-11-28T06:05:39.257Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The total size of all asset variants in bytes',
    example: 1000000,
    type: 'number',
  })
  totalSize: number;

  @ApiProperty({
    description: 'The original asset variant',
    type: AssetVariantDto,
    example: {
      id: 'okie3r17vhfswyyp38v9lrsl',
      type: AssetVariantType.ORIGINAL,
      status: AssetVariantStatus.READY,
      mimeType: SupportedMimeType.JPEG,
      width: 1920,
      height: 1080,
      size: 950120,
      aspectRatio: 1.777777,
      url: 'https://longpoint.example.com/v/okie3r17vhfswyyp38v9lrsl/original.jpg',
    },
  })
  original: AssetVariantDto;

  @ApiProperty({
    description: 'Derivative variants of the original asset.',
    type: [AssetVariantDto],
  })
  derivatives: AssetVariantDto[] = [];

  @ApiProperty({
    description: 'Thumbnails for the asset',
    type: [AssetVariantDto],
  })
  thumbnails: AssetVariantDto[] = [];

  @ApiProperty({
    description: 'Collections this asset belongs to',
    type: [CollectionReferenceDto],
  })
  collections: CollectionReferenceDto[];

  constructor(data: AssetParams) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.totalSize = data.totalSize;
    this.original = data.original;
    this.derivatives = data.derivatives;
    this.thumbnails = data.thumbnails;
    this.collections = data.collections;
  }
}
