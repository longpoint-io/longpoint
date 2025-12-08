import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export interface PaginationMetadataArgs {
  pageSize: number;
  nextCursor: string | null;
  nextLink: string | null;
}

@ApiSchema({ name: 'PaginationMetadata' })
export class PaginationMetadataDto {
  @ApiProperty({
    description: 'The number of items per page',
    example: 1,
    type: 'number',
  })
  pageSize = 100;

  @ApiProperty({
    description: 'The cursor to the next page',
    example: 'jN1a2VuZHMA',
    type: 'string',
    nullable: true,
  })
  nextCursor: string | null = null;

  @ApiProperty({
    description: 'The link to the next page',
    example: 'https://example.com/api/items?cursor=jN1a2VuZHMA',
    type: 'string',
    nullable: true,
  })
  nextLink: string | null = null;

  constructor(args: PaginationMetadataArgs) {
    this.pageSize = args.pageSize;
    this.nextCursor = args.nextCursor;
    this.nextLink = args.nextLink;
  }
}
