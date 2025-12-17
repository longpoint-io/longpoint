import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { TransformerTemplateDto } from './transformer-template.dto';

@ApiSchema({ name: 'ListTransformerTemplatesResponse' })
export class ListTransformerTemplatesResponseDto extends PaginationResponseDto<TransformerTemplateDto> {
  @ApiProperty({
    description: 'The transformer templates in the response',
    type: [TransformerTemplateDto],
  })
  override items: TransformerTemplateDto[];

  constructor(args: PaginationResponseArgs<TransformerTemplateDto>) {
    super(args);
    this.items = args.items;
  }
}
