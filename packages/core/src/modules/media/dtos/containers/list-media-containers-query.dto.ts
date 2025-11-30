import { PaginationQueryDto } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListMediaContainersQuery' })
export class ListMediaContainersQueryDto extends PaginationQueryDto {}
