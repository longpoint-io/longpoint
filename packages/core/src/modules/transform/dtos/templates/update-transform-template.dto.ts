import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateTransformTemplateDto } from './create-transform-template.dto';

@ApiSchema({ name: 'UpdateTransformTemplate' })
export class UpdateTransformTemplateDto extends PartialType(
  CreateTransformTemplateDto
) {}
