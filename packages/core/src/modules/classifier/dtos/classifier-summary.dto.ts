import { ApiSchema, PickType } from '@nestjs/swagger';
import { ClassifierDto, ClassifierParams } from './classifier.dto';

export type ClassifierSummaryParams = Pick<
  ClassifierParams,
  'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'provider'
>;

@ApiSchema({ name: 'ClassifierSummary' })
export class ClassifierSummaryDto extends PickType(ClassifierDto, [
  'id',
  'name',
  'description',
  'provider',
  'createdAt',
  'updatedAt',
] as const) {
  constructor(data: ClassifierSummaryParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.provider = data.provider;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
