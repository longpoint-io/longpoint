import { ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VectorProviderShortDto } from './vector-provider-short.dto';

export interface SearchIndexParams {
  id: string;
  name: string;
  active: boolean;
  indexing: boolean;
  vectorProvider: VectorProviderShortDto;
  mediaIndexed: number;
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

  @IsString()
  @IsNotEmpty()
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
    description: 'The vector database provider used by the index',
    example: {
      id: 'pinecone',
      name: 'Pinecone',
      image: null,
    },
  })
  vectorProvider: VectorProviderShortDto;

  @ApiProperty({
    description: 'The number of media items indexed',
    example: 100,
  })
  mediaIndexed: number;

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
    this.vectorProvider = data.vectorProvider;
    this.mediaIndexed = data.mediaIndexed;
    this.lastIndexedAt = data.lastIndexedAt;
    this.config = data.config;
  }
}
