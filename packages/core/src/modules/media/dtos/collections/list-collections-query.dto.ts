import { PaginationQueryDto } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListCollectionsQuery' })
export class ListCollectionsQueryDto extends PaginationQueryDto {}
