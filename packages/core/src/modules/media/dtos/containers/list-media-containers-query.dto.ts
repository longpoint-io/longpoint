import { PaginationQueryDto } from '@/shared/dtos';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'ListMediaContainersQuery' })
export class ListMediaContainersQueryDto extends PaginationQueryDto {
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
    description: 'Filter containers by collection IDs',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  collectionIds?: string[];
}
