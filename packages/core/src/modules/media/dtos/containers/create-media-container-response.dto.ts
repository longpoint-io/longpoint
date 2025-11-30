import { SelectedMediaContainer } from '@/shared/selectors/media.selectors';
import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { MediaContainerDto } from './media-container.dto';

export type CreateMediaContainerResponseParam = Pick<
  SelectedMediaContainer,
  'id' | 'name' | 'status'
> & {
  url: string;
  expiresAt: Date;
};

@ApiSchema({ name: 'CreateMediaContainerResponse' })
export class CreateMediaContainerResponseDto extends PickType(
  MediaContainerDto,
  ['id', 'name', 'status'] as const
) {
  @ApiProperty({
    description: 'The signed URL to upload the asset with.',
    example:
      'https://longpoint.example.com/api/media/abc123/upload?token=abcdefghijklmnopqrst',
  })
  url: string;

  @ApiProperty({
    description: 'The date and time the upload URL expires.',
    example: '2025-11-14T23:09:41.289Z',
  })
  expiresAt: Date;

  constructor(data: CreateMediaContainerResponseParam) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.url = data.url;
    this.expiresAt = data.expiresAt;
  }
}
