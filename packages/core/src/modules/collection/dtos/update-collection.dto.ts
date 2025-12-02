import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateCollectionDto } from './create-collection.dto';

@ApiSchema({ name: 'UpdateCollection' })
export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
