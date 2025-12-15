import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { RuleTriggerEvent } from '../rule.types';
import {
  RuleActionType,
  RunClassifierActionDto,
  RunTransformerActionDto,
} from './action.dto';
import { CompoundConditionDto, SingleConditionDto } from './condition.dto';

@ApiSchema({ name: 'CreateRule' })
@ApiExtraModels(
  SingleConditionDto,
  CompoundConditionDto,
  RunClassifierActionDto,
  RunTransformerActionDto
)
export class CreateRuleDto {
  @IsString()
  @ApiProperty({
    description: 'The display name of the rule',
    example: 'Classify on Upload',
  })
  displayName!: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Whether the rule is enabled',
    example: true,
    default: true,
  })
  enabled?: boolean;

  @IsEnum(['asset.variant.ready'] as const)
  @ApiProperty({
    description: 'The event that triggers this rule',
    example: 'asset.variant.ready',
    enum: ['asset.variant.ready'],
  })
  triggerEvent!: RuleTriggerEvent;

  @IsObject()
  @IsOptional()
  @Type((options) => {
    // CompoundCondition has a 'conditions' array, SingleCondition does not
    const obj = options?.object as Record<string, unknown> | undefined;
    return obj && 'conditions' in obj
      ? CompoundConditionDto
      : SingleConditionDto;
  })
  @ValidateNested()
  @ApiPropertyOptional({
    description: 'The condition to evaluate (optional)',
    oneOf: [
      { $ref: getSchemaPath(SingleConditionDto) },
      { $ref: getSchemaPath(CompoundConditionDto) },
    ],
  })
  condition?: SingleConditionDto | CompoundConditionDto;

  @IsObject()
  @Type((options) => {
    // Use the 'type' field as discriminator
    const obj = options?.object;
    if (obj?.action?.type === RuleActionType.RUN_CLASSIFIER) {
      return RunClassifierActionDto;
    }
    if (obj?.action?.type === RuleActionType.RUN_TRANSFORMER) {
      return RunTransformerActionDto;
    }
    // Default fallback (shouldn't happen with proper validation)
    return RunClassifierActionDto;
  })
  @ValidateNested()
  @ApiProperty({
    description: 'The action to execute when condition matches',
    oneOf: [
      { $ref: getSchemaPath(RunClassifierActionDto) },
      { $ref: getSchemaPath(RunTransformerActionDto) },
    ],
  })
  action!: RunClassifierActionDto | RunTransformerActionDto;
}
