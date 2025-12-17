import { PaginationQueryDto } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListRulesQuery' })
export class ListRulesQueryDto extends PaginationQueryDto {}
