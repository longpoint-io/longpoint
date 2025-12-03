import { AssetSummaryDto } from '@/modules/media/dtos/containers/asset-summary.dto';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'SearchResults' })
export class SearchResultsDto {
  @ApiProperty({
    description: 'The search results',
    type: [AssetSummaryDto],
  })
  results: AssetSummaryDto[];

  @ApiProperty({
    description: 'Total number of results',
    example: 5,
  })
  total: number;

  constructor(results: AssetSummaryDto[]) {
    this.results = results;
    this.total = results.length;
  }
}
