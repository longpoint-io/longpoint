import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { MediaContainerSummaryDto } from './media-container-summary.dto';

@ApiSchema({ name: 'ListMediaContainersResponse' })
export class ListMediaContainersResponseDto extends PaginationResponseDto<MediaContainerSummaryDto> {
  @ApiProperty({
    description: 'The media containers in the response',
    type: [MediaContainerSummaryDto],
  })
  override items: MediaContainerSummaryDto[] = [];

  constructor(args: PaginationResponseArgs<MediaContainerSummaryDto>) {
    super(args);
    this.items = args.items;
  }
}
