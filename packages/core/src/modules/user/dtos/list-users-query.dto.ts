import { PaginationQueryDto } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListUsersQuery' })
export class ListUsersQueryDto extends PaginationQueryDto {}
