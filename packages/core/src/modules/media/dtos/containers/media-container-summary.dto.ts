import { ApiSchema, PickType } from '@nestjs/swagger';
import { MediaContainerDto, MediaContainerParams } from './media-container.dto';

export type MediaContainerSummaryParams = Pick<
  MediaContainerParams,
  'id' | 'name' | 'type' | 'path' | 'status' | 'createdAt' | 'updatedAt'
>;

@ApiSchema({ name: 'MediaContainerSummary' })
export class MediaContainerSummaryDto extends PickType(MediaContainerDto, [
  'id',
  'name',
  'type',
  'path',
  'status',
  'createdAt',
  'updatedAt',
] as const) {
  constructor(data: MediaContainerSummaryParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.path = data.path;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
