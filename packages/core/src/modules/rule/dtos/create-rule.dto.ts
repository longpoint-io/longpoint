import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RuleActionType, RuleTriggerEvent } from '../rule.types';
import { RunClassifierActionDto, RunTransformerActionDto } from './action.dto';
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

  @IsEnum(RuleTriggerEvent)
  @ApiProperty({
    description: 'The event that triggers this rule',
    example: RuleTriggerEvent.ASSET_VARIANT_READY,
    enum: RuleTriggerEvent,
  })
  triggerEvent!: RuleTriggerEvent;

  @IsObject()
  @IsOptional()
  @Type((options) => {
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

  @ArrayMinSize(1, { message: 'At least one action is required' })
  @Transform(({ value }) => value?.map(instantiateAction))
  @ValidateNested({ each: true })
  @ApiProperty({
    description: 'The actions to execute when condition matches',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RunClassifierActionDto) },
        { $ref: getSchemaPath(RunTransformerActionDto) },
      ],
    },
  })
  actions!: (RunClassifierActionDto | RunTransformerActionDto)[];
}

const instantiateAction = (action: any) => {
  if (action.type === RuleActionType.RUN_CLASSIFIER) {
    return new RunClassifierActionDto(action);
  } else if (action.type === RuleActionType.RUN_TRANSFORMER) {
    return new RunTransformerActionDto(action);
  }
  return action;
};
