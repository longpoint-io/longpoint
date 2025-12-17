import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import {
  RuleActionType,
  type RunClassifierAction,
  type RunTransformerAction,
} from '../rule.types';

@ApiSchema({ name: 'RunClassifierAction' })
export class RunClassifierActionDto {
  @IsEnum([RuleActionType.RUN_CLASSIFIER])
  @ApiProperty({
    description: 'The type of action',
    enum: [RuleActionType.RUN_CLASSIFIER],
  })
  type = RuleActionType.RUN_CLASSIFIER;

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
  @IsEnum([RuleActionType.RUN_TRANSFORMER])
  @ApiProperty({
    description: 'The action type',
    enum: [RuleActionType.RUN_TRANSFORMER],
  })
  type = RuleActionType.RUN_TRANSFORMER;

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
