import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { TransformerDto } from './transformer.dto';

@ApiSchema({ name: 'ListTransformersResponse' })
export class ListTransformersResponseDto extends PaginationResponseDto<TransformerDto> {
  @ApiProperty({
    description: 'The transformers in the response',
    type: [TransformerDto],
  })
  override items: TransformerDto[];

  constructor(args: PaginationResponseArgs<TransformerDto>) {
    super(args);
    this.items = args.items;
  }
}
