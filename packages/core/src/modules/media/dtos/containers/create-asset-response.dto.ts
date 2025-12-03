import { SelectedAsset } from '@/modules/media/media.selectors';
import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { AssetDto } from './asset.dto';

export type CreateAssetResponseParam = Pick<
  SelectedAsset,
  'id' | 'name' | 'status'
> & {
  url: string;
  expiresAt: Date;
};

@ApiSchema({ name: 'CreateAssetResponse' })
export class CreateAssetResponseDto extends PickType(AssetDto, [
  'id',
  'name',
  'status',
] as const) {
  @ApiProperty({
    description: 'The signed URL to upload the variant with.',
    example:
      'https://longpoint.example.com/api/assets/containers/abc123/upload?token=abcdefghijklmnopqrst',
  })
  url: string;

  @ApiProperty({
    description: 'The date and time the upload URL expires.',
    example: '2025-11-14T23:09:41.289Z',
  })
  expiresAt: Date;

  constructor(data: CreateAssetResponseParam) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.url = data.url;
    this.expiresAt = data.expiresAt;
  }
}
