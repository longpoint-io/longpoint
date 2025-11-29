import {
  MediaContainerSummaryDto,
  MediaContainerSummaryParams,
} from '@/modules/media/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { TreeItem, TreeItemType } from '../../media.types';

export type MediaContainerTreeItemParams = MediaContainerSummaryParams;

@ApiSchema({ name: 'MediaContainerTreeItem' })
export class MediaContainerTreeItemDto
  extends MediaContainerSummaryDto
  implements TreeItem
{
  @ApiProperty({
    description: 'The type of the tree item',
    example: TreeItemType.MEDIA,
    enum: [TreeItemType.MEDIA],
  })
  treeItemType: typeof TreeItemType.MEDIA = TreeItemType.MEDIA;

  constructor(data: MediaContainerTreeItemParams) {
    super(data);
    this.id = data.id;
    this.name = data.name;
    this.path = data.path;
    this.type = data.type;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
