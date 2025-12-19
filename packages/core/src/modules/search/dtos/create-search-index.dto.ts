import type { ConfigValues } from '@longpoint/config-schema';
import { IsDisplayName } from '@longpoint/validations/resource-identifiers';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

@ApiSchema({ name: 'CreateSearchIndex' })
export class CreateSearchIndexDto {
  @IsDisplayName('search index')
  @ApiProperty({
    description: 'The name of the search index',
    example: 'Main',
  })
  name!: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether to make the new index the active index.',
    example: true,
    default: false,
    type: Boolean,
  })
  active = false;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      "The fully qualified ID of the embedding model to use for the index. Leave blank to use the search provider's embedding model, if supported.",
    example: 'openai/text-embedding-3-small',
  })
  embeddingModelId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the search provider to use for the index',
    example: 'pinecone',
  })
  searchProviderId!: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Provider-specific configuration for the index',
    example: {},
  })
  config?: ConfigValues;
}
