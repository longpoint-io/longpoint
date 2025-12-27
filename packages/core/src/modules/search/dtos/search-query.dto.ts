import { ApiPaginationQueryDto } from '@/shared/dtos';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'SearchQuery' })
export class SearchQueryDto extends ApiPaginationQueryDto({
  defaultPageSize: 100,
}) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The search query text',
    example: 'sunset beach',
  })
  text!: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    additionalProperties: {
      oneOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { items: { type: 'string' } },
      ],
    },
    properties: {
      storageUnitId: { type: 'string', required: false },
    },
    description: 'Asset metadata filters to apply to the search',
    example: {
      category: 'Podcast',
      storageUnitId: 'mbjq36xe6397dsi6x9nq4ghc',
    },
  })
  metadata?: Record<string, string | number | boolean | string[]>;
}
