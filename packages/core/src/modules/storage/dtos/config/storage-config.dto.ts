import { type ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { StorageProviderDto } from '../provider';

export interface StorageConfigReferenceParams {
  id: string;
  name: string;
}

@ApiSchema({ name: 'StorageConfigReference' })
export class StorageConfigReferenceDto {
  @ApiProperty({
    description: 'The ID of the storage config',
    example: 'mbjq36xe6397dsi6x9nq4ghc',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the storage config',
    example: 'App UGC',
  })
  name: string;

  constructor(data: StorageConfigReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export interface StorageConfigParams extends StorageConfigReferenceParams {
  provider: StorageProviderDto;
  storageUnitCount?: number;
}

@ApiSchema({ name: 'StorageConfig' })
export class StorageConfigDto extends StorageConfigReferenceDto {
  @ApiProperty({
    description: 'The storage provider the config is for',
    type: StorageProviderDto,
  })
  provider: StorageProviderDto;

  @ApiProperty({
    description: 'Number of storage units using this config',
    example: 3,
    type: 'number',
  })
  storageUnitCount?: number;

  constructor(data: StorageConfigParams) {
    super(data);
    this.provider = data.provider;
    this.storageUnitCount = data.storageUnitCount;
  }
}

export interface StorageConfigDetailsParams extends StorageConfigParams {
  config?: ConfigValues | null;
  createdAt: Date;
  updatedAt: Date;
}

@ApiSchema({ name: 'StorageConfigDetails' })
export class StorageConfigDetailsDto extends StorageConfigDto {
  @ApiProperty({
    description: 'Configuration for the provider',
    nullable: true,
    example: {},
  })
  config: ConfigValues | null;

  @ApiProperty({
    description: 'When the config was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the config was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: StorageConfigDetailsParams) {
    super(data);
    this.config = data.config ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
