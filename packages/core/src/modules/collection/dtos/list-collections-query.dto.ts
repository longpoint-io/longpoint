import { PaginationQueryDto } from '@/shared/dtos';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export const ListCollectionsSort = {
  LAST_UPDATED: 'updatedAt:desc',
  NAME_ASC: 'name:asc',
  NAME_DESC: 'name:desc',
} as const;

export type ListCollectionsSort =
  (typeof ListCollectionsSort)[keyof typeof ListCollectionsSort];

@ApiSchema({ name: 'ListCollectionsQuery' })
export class ListCollectionsQueryDto extends PaginationQueryDto {
  @IsEnum(ListCollectionsSort)
  @ApiPropertyOptional({
    description: 'The sort order of the collections. Defaults to last updated.',
    default: ListCollectionsSort.LAST_UPDATED,
    enum: ListCollectionsSort,
  })
  @IsOptional()
  sort = ListCollectionsSort.LAST_UPDATED;
}
