import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { CollectionDto } from './collection.dto';

@ApiSchema({ name: 'ListCollectionsResponse' })
export class ListCollectionsResponseDto extends PaginationResponseDto<CollectionDto> {
  @ApiProperty({
    description: 'The collections in the response',
    type: [CollectionDto],
  })
  override items: CollectionDto[] = [];

  constructor(args: PaginationResponseArgs<CollectionDto>) {
    super(args);
    this.items = args.items;
  }
}
