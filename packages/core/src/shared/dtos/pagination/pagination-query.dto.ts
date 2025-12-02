import { Prisma } from '@/database';
import { base64Decode } from '@longpoint/utils/string';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'PaginationQuery' })
export class PaginationQueryDto {
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

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiPropertyOptional({
    description: 'The number of items per page',
    default: 100,
    type: 'number',
  })
  pageSize = 100;

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
