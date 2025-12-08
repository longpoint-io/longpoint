import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { TransformTemplateDto } from './transform-template.dto';

@ApiSchema({ name: 'ListTransformTemplatesResponse' })
export class ListTransformTemplatesResponseDto extends PaginationResponseDto<TransformTemplateDto> {
  @ApiProperty({
    description: 'The transform templates in the response',
    type: [TransformTemplateDto],
  })
  override items: TransformTemplateDto[];

  constructor(args: PaginationResponseArgs<TransformTemplateDto>) {
    super(args);
    this.items = args.items;
  }
}
