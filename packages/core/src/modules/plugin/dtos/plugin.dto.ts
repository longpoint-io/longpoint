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
import { IsObject } from 'class-validator';
import { PluginType } from '../services/plugin-registry.service';

export interface PluginSummaryParams {
  id: string;
  displayName: string;
  description?: string;
  icon?: string;
  type?: PluginType;
  hasSettings: boolean;
}

export interface PluginParams extends PluginSummaryParams {
  packageName: string;
  settingsSchema?: ConfigSchemaDefinition;
  settingsValues?: ConfigValues;
}

@ApiSchema({ name: 'PluginSummary' })
export class PluginSummaryDto {
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
    description: 'The type of the plugin',
    enum: ['storage', 'ai', 'vector'],
    nullable: true,
  })
  type: PluginType | null;

  @ApiProperty({
    description: 'Whether the plugin has configurable settings',
    example: true,
  })
  hasSettings: boolean;

  constructor(data: PluginSummaryParams) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.icon = data.icon ?? null;
    this.type = data.type ?? null;
    this.hasSettings = data.hasSettings;
  }
}

@ApiSchema({ name: 'Plugin' })
export class PluginDto {
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
    description: 'The type of the plugin',
    enum: ['storage', 'ai', 'vector'],
    nullable: true,
  })
  type: PluginType | null;

  @ApiProperty({
    description: 'Whether the plugin has configurable settings',
    example: true,
  })
  hasSettings: boolean;

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

  constructor(data: PluginParams) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.icon = data.icon ?? null;
    this.type = data.type ?? null;
    this.hasSettings = data.hasSettings;
    this.packageName = data.packageName;
    this.settingsSchema = data.settingsSchema
      ? toConfigSchemaForDto(data.settingsSchema)
      : null;
    this.settingsValues = data.settingsValues ?? null;
  }
}

@ApiSchema({ name: 'UpdatePluginSettings' })
export class UpdatePluginSettingsDto {
  @IsObject()
  @ApiProperty({
    description: 'The configuration values to update',
    type: 'object',
    additionalProperties: true,
    example: {
      apiKey: 'sk-1234567890',
    },
  })
  config!: ConfigValues;
}
