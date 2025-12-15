import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { RuleDto } from './rule.dto';

@ApiSchema({ name: 'ListRulesResponse' })
export class ListRulesResponseDto extends PaginationResponseDto<RuleDto> {
  @ApiProperty({
    description: 'The rules in the response',
    type: [RuleDto],
  })
  override items: RuleDto[];

  constructor(args: PaginationResponseArgs<RuleDto>) {
    super(args);
    this.items = args.items;
  }
}
