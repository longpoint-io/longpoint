import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ComparisonOperator, LogicalOperator } from '../rule.types';

@ApiSchema({ name: 'SingleCondition' })
export class SingleConditionDto {
  @IsString()
  @ApiProperty({
    description:
      'The field path to evaluate (e.g., "variant.type", "variant.metadata.category")',
    example: 'variant.type',
  })
  field!: string;

  @IsEnum(ComparisonOperator)
  @ApiProperty({
    description: 'The comparison operator',
    enum: ComparisonOperator,
    example: ComparisonOperator.EQUALS,
  })
  operator!: ComparisonOperator;

  @Allow()
  @Expose()
  @Transform(({ value }) => value)
  @ApiProperty({
    description:
      'The value to compare against (can be string, number, boolean, etc.)',
    example: 'ORIGINAL',
  })
  value!: unknown;
}

@ApiSchema({ name: 'CompoundCondition' })
@ApiExtraModels(SingleConditionDto)
export class CompoundConditionDto {
  @IsEnum(LogicalOperator)
  @ApiProperty({
    description: 'The logical operator to combine conditions',
    enum: LogicalOperator,
    example: LogicalOperator.AND,
  })
  operator!: LogicalOperator;

  @IsArray()
  @Type((options) => {
    const value = options?.object?.[options?.property as string] as
      | Record<string, unknown>
      | undefined;
    return value && 'conditions' in value
      ? CompoundConditionDto
      : SingleConditionDto;
  })
  @ValidateNested({ each: true })
  @ApiProperty({
    description:
      'The conditions to combine (can be single or compound conditions)',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(SingleConditionDto) },
        { $ref: '#/components/schemas/CompoundCondition' },
      ],
    },
  })
  conditions!: (SingleConditionDto | CompoundConditionDto)[];
}

export type RuleConditionDto = SingleConditionDto | CompoundConditionDto;
