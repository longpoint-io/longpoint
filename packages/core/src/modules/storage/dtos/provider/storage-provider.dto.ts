import { type ConfigSchemaForDto, toConfigSchemaForDto } from '@/shared/dtos';
import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';

export interface StorageProviderReferenceParams {
  id: string;
  name: string;
}

@ApiSchema({ name: 'StorageProviderReference' })
export class StorageProviderReferenceDto {
  @ApiProperty({
    description: 'The ID of the storage provider',
    example: 'local',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the storage provider',
    example: 'Local',
  })
  name: string;

  constructor(data: StorageProviderReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export interface StorageProviderParams extends StorageProviderReferenceParams {
  image?: string | null;
}

@ApiSchema({ name: 'StorageProvider' })
export class StorageProviderDto extends StorageProviderReferenceDto {
  @ApiProperty({
    description: 'An icon image of the storage provider',
    type: 'string',
    nullable: true,
  })
  image: string | null;

  constructor(data: StorageProviderParams) {
    super(data);
    this.image = data.image ?? null;
  }
}

export interface StorageProviderDetailsParams extends StorageProviderParams {
  configSchema?: ConfigSchemaDefinition;
}

@ApiSchema({ name: 'StorageProviderDetails' })
export class StorageProviderDetailsDto extends StorageProviderDto {
  @ApiProperty({
    description: 'The schema for the storage provider config',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath('ConfigSchemaValue'),
    },
    example: {
      folderName: {
        label: 'Folder Name',
        type: 'string',
        required: true,
      },
    },
  })
  configSchema: ConfigSchemaForDto;

  constructor(data: StorageProviderDetailsParams) {
    super(data);
    this.configSchema = data.configSchema
      ? toConfigSchemaForDto(data.configSchema)
      : {};
  }
}
