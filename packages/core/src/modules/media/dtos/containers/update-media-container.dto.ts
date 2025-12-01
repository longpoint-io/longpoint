import { ApiSchema, PartialType, PickType } from '@nestjs/swagger';
import { CreateMediaContainerDto } from './create-media-container.dto';

@ApiSchema({ name: 'UpdateMediaContainer' })
export class UpdateMediaContainerDto extends PartialType(
  PickType(CreateMediaContainerDto, ['name', 'collectionIds'] as const)
) {}
