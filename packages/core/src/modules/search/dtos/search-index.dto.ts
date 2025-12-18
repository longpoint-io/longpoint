import { ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { SearchProviderReferenceDto } from './search-provider.dto';

export interface SearchIndexParams {
  id: string;
  name: string;
  active: boolean;
  indexing: boolean;
  searchProvider: SearchProviderReferenceDto;
  assetsIndexed: number;
  lastIndexedAt: Date | null;
  config: ConfigValues | null;
}

@ApiSchema({ name: 'SearchIndex' })
export class SearchIndexDto {
  @ApiProperty({
    description: 'The ID of the index',
    example: 'o1jnduht9zboa0w1dcjfzqi5',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the index',
    example: 'my-index',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the index is active',
    example: true,
    default: false,
  })
  active: boolean;

  @ApiProperty({
    description: 'Whether the index is currently indexing',
    example: false,
  })
  indexing: boolean;

  @ApiProperty({
    description: 'The search provider used by the index',
    type: SearchProviderReferenceDto,
    example: {
      id: 'pinecone',
      name: 'Pinecone',
      image: null,
    },
  })
  searchProvider: SearchProviderReferenceDto;

  @ApiProperty({
    description: 'The number of assets indexed',
    example: 100,
  })
  assetsIndexed: number;

  @ApiProperty({
    description: 'The date and time the index last ran successfully',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  lastIndexedAt: Date | null;

  @ApiProperty({
    description: 'The configuration values for the index',
    type: 'object',
    nullable: true,
    additionalProperties: true,
  })
  config: ConfigValues | null;

  constructor(data: SearchIndexParams) {
    this.id = data.id;
    this.name = data.name;
    this.active = data.active;
    this.indexing = data.indexing;
    this.searchProvider = data.searchProvider;
    this.assetsIndexed = data.assetsIndexed;
    this.lastIndexedAt = data.lastIndexedAt;
    this.config = data.config;
  }
}
