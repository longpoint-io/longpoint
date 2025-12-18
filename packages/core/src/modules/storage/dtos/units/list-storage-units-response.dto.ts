import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { StorageUnitDto } from './storage-unit.dto';

@ApiSchema({ name: 'ListStorageUnitsResponse' })
export class ListStorageUnitsResponseDto extends PaginationResponseDto<StorageUnitDto> {
  @ApiProperty({
    description: 'The storage units in the response',
    type: [StorageUnitDto],
  })
  override items: StorageUnitDto[];

  constructor(args: PaginationResponseArgs<StorageUnitDto>) {
    super(args);
    this.items = args.items;
  }
}
