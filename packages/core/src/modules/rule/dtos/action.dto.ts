import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
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
  })
  classifierTemplateId!: string;

  constructor(data: RunClassifierAction) {
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
  @ApiProperty({
    description: 'The ID of the transform template to run',
    example: 'xyz789',
  })
  transformTemplateId!: string;

  @IsString()
  @ApiProperty({
    description:
      'The ID of the source variant to transform. Supports template interpolation: {{variant.id}}',
    example: '{{variant.id}}',
  })
  sourceVariantId!: string;

  constructor(data: RunTransformerAction) {
    this.type = RuleActionType.RUN_TRANSFORMER;
    this.transformTemplateId = data.transformTemplateId;
    this.sourceVariantId = data.sourceVariantId;
  }
}

export type RuleActionDto = RunClassifierActionDto | RunTransformerActionDto;
