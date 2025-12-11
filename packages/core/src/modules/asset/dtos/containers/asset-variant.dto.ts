import { AssetVariantStatus } from '@/database';
import { type SelectedAssetVariant } from '@/modules/asset/asset.selectors';
import { JsonObject } from '@/shared/types/object.types';
import { SupportedMimeType } from '@longpoint/types';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export type AssetVariantParams = Omit<SelectedAssetVariant, 'assetId'> & {
  aspectRatio: number | null;
  url?: string;
};

@ApiSchema({ name: 'AssetVariant' })
export class AssetVariantDto {
  @ApiProperty({
    description: 'The ID of the asset variant',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the asset variant',
    example: 'Original',
    type: 'string',
    nullable: true,
  })
  displayName: string | null;

  @ApiProperty({
    description: 'The status of the asset variant',
    example: AssetVariantStatus.WAITING_FOR_UPLOAD,
    enum: AssetVariantStatus,
  })
  status: AssetVariantStatus;

  @ApiProperty({
    description: 'The MIME type of the asset variant',
    example: SupportedMimeType.JPEG,
    enum: SupportedMimeType,
  })
  mimeType: SupportedMimeType;

  @ApiProperty({
    description: 'The width of the asset variant in pixels, if applicable',
    example: 100,
    type: 'number',
    nullable: true,
  })
  width: number | null;

  @ApiProperty({
    description: 'The height of the asset variant in pixels, if applicable',
    example: 100,
    type: 'number',
    nullable: true,
  })
  height: number | null;

  @ApiProperty({
    description: 'The size of the asset variant in bytes',
    example: 100,
    type: 'number',
    nullable: true,
  })
  size: number | null;

  @ApiProperty({
    description: 'The aspect ratio of the asset variant, if applicable',
    example: 1.777777,
    type: 'number',
    nullable: true,
  })
  aspectRatio: number | null;

  @ApiProperty({
    description: 'The duration of the asset variant in seconds, if applicable',
    example: 120,
    type: 'number',
    nullable: true,
  })
  duration: number | null;

  @ApiProperty({
    description:
      'Freeform metadata that can be populated by classifiers or manually edited',
    example: {
      'my-classifier': {
        tags: ['person', 'car', 'tree'],
      },
    },
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  metadata: JsonObject | null;

  @ApiProperty({
    description: 'The URL of the asset variant',
    type: 'string',
    example:
      'https://longpoint.example.com/v/r2qwyd76nvd98cu6ewg8ync2/original.jpg',
    nullable: true,
  })
  url: string | null;

  constructor(data: AssetVariantParams) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.status = data.status;
    this.mimeType = data.mimeType as SupportedMimeType;
    this.width = data.width;
    this.height = data.height;
    this.size = data.size;
    this.aspectRatio = data.aspectRatio ?? null;
    this.duration = data.duration;
    this.metadata = (data.metadata as JsonObject | null) ?? null;
    this.url = data.url ?? null;
  }
}
