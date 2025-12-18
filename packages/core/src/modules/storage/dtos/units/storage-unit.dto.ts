import { SelectedStorageUnit } from '@/shared/selectors/storage-unit.selectors';
import { ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { StorageProviderReferenceDto } from '../provider';

export interface StorageUnitReferenceParams {
  id: string;
  name: string;
}

@ApiSchema({ name: 'StorageUnitReference' })
export class StorageUnitReferenceDto {
  @ApiProperty({
    description: 'The ID of the storage unit',
    example: 'mbjq36xe6397dsi6x9nq4ghc',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the storage unit',
    example: 'Local Default',
  })
  name: string;

  constructor(data: StorageUnitReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export interface StorageUnitParams
  extends StorageUnitReferenceParams,
    Pick<SelectedStorageUnit, 'isDefault' | 'createdAt' | 'updatedAt'> {
  provider: StorageProviderReferenceDto;
}

@ApiSchema({ name: 'StorageUnit' })
export class StorageUnitDto extends StorageUnitReferenceDto {
  @ApiProperty({
    description: 'The storage provider',
    type: StorageProviderReferenceDto,
  })
  provider: StorageProviderReferenceDto;

  @ApiProperty({
    description: 'Whether this is the default storage unit',
    example: true,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'When the storage unit was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the storage unit was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: StorageUnitParams) {
    super(data);
    this.provider = data.provider;
    this.isDefault = data.isDefault;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

export interface StorageUnitDetailsParams extends StorageUnitParams {
  config: ConfigValues | null;
}

@ApiSchema({ name: 'StorageUnitDetails' })
export class StorageUnitDetailsDto extends StorageUnitDto {
  @ApiProperty({
    description: 'Provider-specific configuration (decrypted)',
    nullable: true,
    example: {},
  })
  config: ConfigValues | null;

  constructor(data: StorageUnitDetailsParams) {
    super(data);
    this.config = data.config;
  }
}
