import { PaginationQueryDto } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListClassifierTemplatesQuery' })
export class ListClassifierTemplatesQueryDto extends PaginationQueryDto {}
