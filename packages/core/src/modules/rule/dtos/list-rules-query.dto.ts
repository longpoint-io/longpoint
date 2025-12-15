import { PaginationQueryDto } from '@/shared/dtos';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { type RuleTriggerEvent } from '../rule.types';

@ApiSchema({ name: 'ListRulesQuery' })
export class ListRulesQueryDto extends PaginationQueryDto {
  @IsEnum(['asset.variant.ready'] as const)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Filter by trigger event',
    example: 'asset.variant.ready',
    enum: ['asset.variant.ready'],
  })
  triggerEvent?: RuleTriggerEvent;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Filter by enabled status',
    example: true,
  })
  enabled?: boolean;
}
