import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateRuleDto } from './create-rule.dto';

@ApiSchema({ name: 'UpdateRule' })
export class UpdateRuleDto extends PartialType(CreateRuleDto) {}
