import { ApiPaginationQueryDto, MAX_PAGE_SIZE } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListTransformerTemplatesQuery' })
export class ListTransformerTemplatesQueryDto extends ApiPaginationQueryDto({
  defaultPageSize: MAX_PAGE_SIZE,
}) {}
