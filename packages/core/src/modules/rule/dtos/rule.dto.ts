import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { RuleCondition } from '../rule.types';
import {
  type RuleActionDto,
  RunClassifierActionDto,
  RunTransformerActionDto,
} from './action.dto';
import { CompoundConditionDto, SingleConditionDto } from './condition.dto';

export interface RuleParams {
  id: string;
  displayName: string;
  enabled: boolean;
  triggerEvent: string;
  condition: RuleCondition | null;
  action: RuleActionDto;
  createdAt: Date;
  updatedAt: Date;
}

@ApiSchema({ name: 'Rule' })
@ApiExtraModels(
  SingleConditionDto,
  CompoundConditionDto,
  RunClassifierActionDto,
  RunTransformerActionDto
)
export class RuleDto {
  @ApiProperty({
    description: 'The ID of the rule',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the rule',
    example: 'Classify on Upload',
  })
  displayName: string;

  @ApiProperty({
    description: 'Whether the rule is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'The event that triggers this rule',
    example: 'asset.variant.ready',
  })
  triggerEvent: string;

  @ApiProperty({
    description: 'The condition to evaluate (optional)',
    oneOf: [
      { $ref: getSchemaPath(SingleConditionDto) },
      { $ref: getSchemaPath(CompoundConditionDto) },
    ],
    nullable: true,
  })
  condition: RuleCondition | null;

  @ApiProperty({
    description: 'The action to execute when condition matches',
    oneOf: [
      { $ref: getSchemaPath(RunClassifierActionDto) },
      { $ref: getSchemaPath(RunTransformerActionDto) },
    ],
  })
  action: RuleActionDto;

  @ApiProperty({
    description: 'When the rule was created',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the rule was last updated',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
  })
  updatedAt: Date;

  constructor(data: RuleParams) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.enabled = data.enabled;
    this.triggerEvent = data.triggerEvent;
    this.condition = data.condition;
    this.action = data.action;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
