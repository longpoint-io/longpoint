import { SelectedCollection } from '@/modules/collection/collection.selectors';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export type CollectionReferenceParams = Pick<SelectedCollection, 'id' | 'name'>;

@ApiSchema({ name: 'CollectionReference' })
export class CollectionReferenceDto {
  @ApiProperty({
    description: 'The ID of the collection',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the collection',
    example: '2025 Highlights',
  })
  name: string;

  constructor(data: CollectionReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export type CollectionParams = CollectionReferenceParams &
  Pick<SelectedCollection, 'createdAt' | 'updatedAt'> & {
    assetCount: number;
  };

@ApiSchema({ name: 'Collection' })
export class CollectionDto extends CollectionReferenceDto {
  @ApiProperty({
    description: 'The number of assets in the collection',
    example: 42,
  })
  assetCount: number;

  @ApiProperty({
    description: 'When the collection was created',
    example: '2025-11-30T04:25:50.489Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the collection was last updated',
    example: '2025-11-28T06:05:39.257Z',
  })
  updatedAt: Date;

  constructor(data: CollectionParams) {
    super(data);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.assetCount = data.assetCount;
  }
}

export type CollectionDetailsParams = CollectionParams &
  Pick<SelectedCollection, 'description'>;

@ApiSchema({ name: 'CollectionDetails' })
export class CollectionDetailsDto extends CollectionDto {
  @ApiProperty({
    description: 'The description of the collection',
    example: '2025 content highlights for annual showcase',
    nullable: true,
    type: 'string',
  })
  description: string | null;

  constructor(data: CollectionDetailsParams) {
    super(data);
    this.description = data.description;
  }
}
