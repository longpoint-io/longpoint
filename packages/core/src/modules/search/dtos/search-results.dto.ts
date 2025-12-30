import { AssetDto } from '@/modules/asset/dtos/containers/asset.dto';
import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'SearchResults' })
export class SearchResultsDto extends PaginationResponseDto<AssetDto> {
  @ApiProperty({
    description: 'The search results',
    type: [AssetDto],
  })
  override items: AssetDto[] = [];

  constructor(args: PaginationResponseArgs<AssetDto>) {
    super(args);
    this.items = args.items;
  }
}
