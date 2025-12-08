import { ApiPaginationQueryDto } from '@/shared/dtos';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'ListAssetsQuery' })
export class ListAssetsQueryDto extends ApiPaginationQueryDto({
  defaultPageSize: 100,
}) {
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.filter((v) => v && String(v).trim() !== '');
    }
    if (typeof value === 'string') {
      return value.split(',').filter((v) => v.trim() !== '');
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Filter assets by collection IDs',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  collectionIds?: string[];
}
