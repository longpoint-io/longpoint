import { ApiSchema, PickType } from '@nestjs/swagger';
import { ClassifierTemplateDto } from './classifier-template.dto';

export type ClassifierTemplateShortParams = Pick<
  ClassifierTemplateDto,
  'id' | 'name' | 'description'
>;

@ApiSchema({ name: 'ClassifierTemplateShort' })
export class ClassifierTemplateShortDto extends PickType(ClassifierTemplateDto, [
  'id',
  'name',
  'description',
] as const) {
  constructor(data: ClassifierTemplateShortParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
  }
}
