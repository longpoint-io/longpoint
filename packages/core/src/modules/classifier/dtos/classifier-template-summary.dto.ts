import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { ClassifierSummaryDto } from './classifier-summary.dto';
import { ClassifierTemplateDto } from './classifier-template.dto';

export interface ClassifierTemplateSummaryParams {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  provider: ClassifierSummaryDto;
}

@ApiSchema({ name: 'ClassifierTemplateSummary' })
export class ClassifierTemplateSummaryDto extends PickType(
  ClassifierTemplateDto,
  ['id', 'name', 'description', 'createdAt', 'updatedAt'] as const
) {
  @ApiProperty({
    description: 'The classifier used by the classifier template',
    type: ClassifierSummaryDto,
  })
  provider: ClassifierSummaryDto;

  constructor(data: ClassifierTemplateSummaryParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.provider = data.provider;
  }
}
