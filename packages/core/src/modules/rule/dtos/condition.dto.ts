import { ApiExtraModels, ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';
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

  @IsString()
  @ApiProperty({
    description: 'The value to compare against',
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
    // CompoundCondition has a 'conditions' array, SingleCondition does not
    const obj = options?.object as Record<string, unknown> | undefined;
    return obj && 'conditions' in obj
      ? CompoundConditionDto
      : SingleConditionDto;
  })
  @ValidateNested({ each: true })
  @ApiProperty({
    description:
      'The conditions to combine (can be single or compound conditions)',
    type: [Object],
  })
  conditions!: (SingleConditionDto | CompoundConditionDto)[];
}
