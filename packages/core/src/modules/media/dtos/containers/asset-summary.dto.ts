import { ApiSchema, PickType } from '@nestjs/swagger';
import { AssetDto, AssetParams } from './asset.dto';

export type AssetSummaryParams = Pick<
  AssetParams,
  'id' | 'name' | 'type' | 'status' | 'createdAt' | 'updatedAt'
>;

@ApiSchema({ name: 'AssetSummary' })
export class AssetSummaryDto extends PickType(AssetDto, [
  'id',
  'name',
  'type',
  'status',
  'createdAt',
  'updatedAt',
] as const) {
  constructor(data: AssetSummaryParams) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
