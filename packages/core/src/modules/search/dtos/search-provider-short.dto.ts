import { ApiSchema, PickType } from '@nestjs/swagger';
import { SearchProviderDto, SearchProviderParams } from './search-provider.dto';

export type SearchProviderShortParams = Pick<
  SearchProviderParams,
  'id' | 'name' | 'image'
>;

@ApiSchema({ name: 'SearchProviderShort' })
export class SearchProviderShortDto extends PickType(SearchProviderDto, [
  'id',
  'name',
  'image',
] as const) {
  constructor(data: SearchProviderShortParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.image = data.image ?? null;
  }
}
