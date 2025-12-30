import { ApiSchema, PartialType, PickType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

@ApiSchema({ name: 'UpdateAsset' })
export class UpdateAssetDto extends PartialType(
  PickType(CreateAssetDto, ['name', 'collectionIds', 'metadata'] as const)
) {}
