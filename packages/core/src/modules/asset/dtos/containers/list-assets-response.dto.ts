import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { AssetSummaryDto } from './asset-summary.dto';

@ApiSchema({ name: 'ListAssetsResponse' })
export class ListAssetsResponseDto extends PaginationResponseDto<AssetSummaryDto> {
  @ApiProperty({
    description: 'The assets in the response',
    type: [AssetSummaryDto],
  })
  override items: AssetSummaryDto[] = [];

  constructor(args: PaginationResponseArgs<AssetSummaryDto>) {
    super(args);
    this.items = args.items;
  }
}
