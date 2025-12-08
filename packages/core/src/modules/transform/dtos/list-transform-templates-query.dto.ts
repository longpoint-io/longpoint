import { ApiPaginationQueryDto, MAX_PAGE_SIZE } from '@/shared/dtos';
import { ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ListTransformTemplatesQuery' })
export class ListTransformTemplatesQueryDto extends ApiPaginationQueryDto({
  defaultPageSize: MAX_PAGE_SIZE,
}) {}
