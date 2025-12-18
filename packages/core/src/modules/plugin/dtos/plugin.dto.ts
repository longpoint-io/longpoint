import { ConfigSchemaValueDto } from '@/shared/dtos';
import {
  ConfigSchemaForDto,
  toConfigSchemaForDto,
} from '@/shared/dtos/config-schema';
import type {
  ConfigSchemaDefinition,
  ConfigValues,
} from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';

export interface PluginReferenceParams {
  id: string;
  displayName: string;
}

@ApiSchema({ name: 'PluginReference' })
export class PluginReferenceDto {
  @ApiProperty({
    description: 'The ID of the plugin',
    example: 'openai',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the plugin',
    example: 'OpenAI',
  })
  displayName: string;

  constructor(data: PluginReferenceParams) {
    this.id = data.id;
    this.displayName = data.displayName;
  }
}

export interface PluginParams extends PluginReferenceParams {
  description?: string | null;
  icon?: string | null;
  hasSettings: boolean;
}

@ApiSchema({ name: 'Plugin' })
export class PluginDto extends PluginReferenceDto {
  @ApiProperty({
    description: 'A brief description of the plugin',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'An icon image of the plugin (URL or base64 data URI)',
    type: 'string',
    nullable: true,
  })
  icon: string | null;

  @ApiProperty({
    description: 'Whether the plugin has configurable settings',
    example: true,
  })
  hasSettings: boolean;

  constructor(data: PluginParams) {
    super(data);
    this.description = data.description ?? null;
    this.icon = data.icon ?? null;
    this.hasSettings = data.hasSettings;
  }
}

export interface PluginDetailsParams extends PluginParams {
  packageName: string;
  settingsSchema?: ConfigSchemaDefinition;
  settingsValues?: ConfigValues;
}

@ApiSchema({ name: 'PluginDetails' })
export class PluginDetailsDto extends PluginDto {
  @ApiProperty({
    description: 'The package name of the plugin',
    example: 'longpoint-plugin-openai',
  })
  packageName: string;

  @ApiProperty({
    description: 'The schema for plugin settings',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(ConfigSchemaValueDto),
    },
    nullable: true,
  })
  settingsSchema: ConfigSchemaForDto | null;

  @ApiProperty({
    description: 'The current settings values for the plugin',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  settingsValues: ConfigValues | null;

  constructor(data: PluginDetailsParams) {
    super(data);
    this.packageName = data.packageName;
    this.settingsSchema = data.settingsSchema
      ? toConfigSchemaForDto(data.settingsSchema)
      : null;
    this.settingsValues = data.settingsValues ?? null;
  }
}
