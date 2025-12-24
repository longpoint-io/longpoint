import { ApiPaginationQueryDto } from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'SearchQuery' })
export class SearchQueryDto extends ApiPaginationQueryDto({
  defaultPageSize: 100,
}) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The search query text',
    example: 'sunset beach',
  })
  query!: string;
}
