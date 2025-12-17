import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateTransformerTemplateDto } from './create-transformer-template.dto';

@ApiSchema({ name: 'UpdateTransformerTemplate' })
export class UpdateTransformerTemplateDto extends PartialType(
  CreateTransformerTemplateDto
) {}
