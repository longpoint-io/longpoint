import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ClassifierTemplateDto } from './classifier-template.dto';

@ApiSchema({ name: 'ListClassifierTemplatesResponse' })
export class ListClassifierTemplatesResponseDto extends PaginationResponseDto<ClassifierTemplateDto> {
  @ApiProperty({
    description: 'The classifier templates in the response',
    type: [ClassifierTemplateDto],
  })
  override items: ClassifierTemplateDto[];

  constructor(args: PaginationResponseArgs<ClassifierTemplateDto>) {
    super(args);
    this.items = args.items;
  }
}
