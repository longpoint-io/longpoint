import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import type { RunClassifierAction, RunTransformerAction } from '../rule.types';

export enum RuleActionType {
  RUN_CLASSIFIER = 'runClassifier',
  RUN_TRANSFORMER = 'runTransformer',
}

@ApiSchema({ name: 'RunClassifierAction' })
export class RunClassifierActionDto {
  @IsEnum(RuleActionType)
  @ApiProperty({
    description: 'The type of action',
    enum: RuleActionType,
    example: RuleActionType.RUN_CLASSIFIER,
  })
  type!: RuleActionType.RUN_CLASSIFIER;

  @IsString()
  @ApiProperty({
    description: 'The ID of the classifier template to run',
    example: 'abc123',
    required: false,
  })
  classifierTemplateId!: string;

  constructor(data: RunClassifierAction) {
    if (!data) return;
    this.type = RuleActionType.RUN_CLASSIFIER;
    this.classifierTemplateId = data.classifierTemplateId;
  }
}

@ApiSchema({ name: 'RunTransformerAction' })
export class RunTransformerActionDto {
  @IsEnum(RuleActionType)
  @ApiProperty({
    description: 'The type of action',
    enum: RuleActionType,
    example: RuleActionType.RUN_TRANSFORMER,
  })
  type!: RuleActionType.RUN_TRANSFORMER;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.transformTemplateName)
  @ApiProperty({
    description: 'The ID of the transform template to run',
    example: 'xyz789',
    required: false,
  })
  transformTemplateId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.transformTemplateId)
  @ApiProperty({
    description: 'The name of the transform template to run',
    example: 'video-thumbnail',
    required: false,
  })
  transformTemplateName?: string;

  @IsString()
  @ApiProperty({
    description:
      'The ID of the source variant to transform. Supports template interpolation: {{variant.id}}',
    example: '{{variant.id}}',
  })
  sourceVariantId!: string;

  constructor(data: RunTransformerAction) {
    if (!data) return;
    this.type = RuleActionType.RUN_TRANSFORMER;
    this.transformTemplateId = data.transformTemplateId;
    this.transformTemplateName = data.transformTemplateName;
    this.sourceVariantId = data.sourceVariantId;
  }
}

export type RuleActionDto = RunClassifierActionDto | RunTransformerActionDto;
