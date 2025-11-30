import { ApiSchema, PartialType, PickType } from '@nestjs/swagger';
import { MediaContainerDto } from './media-container.dto';

@ApiSchema({ name: 'UpdateMediaContainer' })
export class UpdateMediaContainerDto extends PartialType(
  PickType(MediaContainerDto, ['name'] as const)
) {}
