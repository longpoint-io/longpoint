import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { AssetDto } from './asset.dto';

@ApiSchema({ name: 'ListAssetsResponse' })
export class ListAssetsResponseDto extends PaginationResponseDto<AssetDto> {
  @ApiProperty({
    description: 'The assets in the response',
    type: [AssetDto],
  })
  override items: AssetDto[] = [];

  constructor(args: PaginationResponseArgs<AssetDto>) {
    super(args);
    this.items = args.items;
  }
}
