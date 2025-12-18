import { AssetDto } from '@/modules/asset/dtos/containers/asset.dto';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'SearchResults' })
export class SearchResultsDto {
  @ApiProperty({
    description: 'The search results',
    type: [AssetDto],
  })
  results: AssetDto[];

  @ApiProperty({
    description: 'Total number of results',
    example: 5,
  })
  total: number;

  constructor(results: AssetDto[]) {
    this.results = results;
    this.total = results.length;
  }
}
