import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateClassifierTemplateDto } from './create-classifier-template.dto';

@ApiSchema({ name: 'UpdateClassifierTemplate' })
export class UpdateClassifierTemplateDto extends PartialType(
  CreateClassifierTemplateDto
) {}
