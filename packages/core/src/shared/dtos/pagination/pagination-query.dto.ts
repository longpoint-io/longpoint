import { Prisma } from '@/database';
import { base64Decode } from '@longpoint/utils/string';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Max } from 'class-validator';

export const MAX_PAGE_SIZE = 1000;

/**
 * Creates an API friendly pagination query DTO class.
 * @param object.defaultPageSize - The default number of items per page.
 * @returns
 */
export const ApiPaginationQueryDto = ({
  defaultPageSize = MAX_PAGE_SIZE,
}: {
  defaultPageSize?: number;
} = {}) => {
  class PaginationQueryDtoClass {
    @Transform(({ value }) =>
      value !== undefined && value !== '' ? base64Decode(value) : undefined
    )
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
      type: 'string',
      description: 'The cursor to the next page',
    })
    cursor?: string;

    @Max(MAX_PAGE_SIZE)
    @IsPositive()
    @IsOptional()
    @Transform(({ value }) => Number(value))
    @ApiPropertyOptional({
      description: 'The number of items per page',
      default: defaultPageSize,
      type: 'number',
    })
    pageSize: number = defaultPageSize;

    /**
     * Converts the pagination query into a Prisma cursor pagination object.
     * @param cursorKey - The key to use for the cursor. Defaults to `id`.
     * @returns The Prisma cursor pagination object.
     * @example
     * ```typescript
     * const query = new PaginationQueryDto();
     * const result = await prisma.user.findMany({
     *   ...query.toPrisma(),
     *  where: {
     *    name: {
     *      contains: 'John'
     *    }
     *  }
     * });
     * ```
     */
    toPrisma(cursorKey = 'id') {
      let orderBy: any[] = [];

      if ('sort' in this && typeof this.sort === 'string') {
        const sortOrder = this.sort
          ? (this.sort.split(':')[1] as Prisma.SortOrder)
          : 'desc';
        const sortField = this.sort ? this.sort.split(':')[0] : 'updatedAt';
        orderBy = [{ [sortField]: sortOrder }, { [cursorKey]: 'desc' }];
      }

      return {
        take: this.pageSize,
        skip: this.cursor ? 1 : 0,
        cursor: this.cursor
          ? ({
              [cursorKey]: this.cursor,
            } as any)
          : undefined,
        orderBy,
      };
    }
  }
  return PaginationQueryDtoClass;
};

@ApiSchema({ name: 'PaginationQuery' })
export class PaginationQueryDto extends ApiPaginationQueryDto() {}
