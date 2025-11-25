import { ApiSchema, PickType } from '@nestjs/swagger';
import { ClassifierDto, ClassifierParams } from './classifier.dto';
import { ClassificationProviderSummaryDto } from './classification-provider-summary.dto';

export type ClassifierSummaryParams = Pick<
  ClassifierParams,
  'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'classificationProvider'
>;

@ApiSchema({ name: 'ClassifierSummary' })
export class ClassifierSummaryDto extends PickType(ClassifierDto, [
  'id',
  'name',
  'description',
  'classificationProvider',
  'createdAt',
  'updatedAt',
] as const) {
  constructor(data: ClassifierSummaryParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.classificationProvider = data.classificationProvider;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
