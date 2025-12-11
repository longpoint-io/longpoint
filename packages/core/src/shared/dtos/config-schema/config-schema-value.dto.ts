import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';
import { ConfigSchemaItemsDto } from './config-schema-item.dto';
import { type ConfigSchemaForDto } from './config-schema.types';
import { toConfigSchemaForDto } from './config-schema.utils';

type ConfigSchemaValueParams =
  ConfigSchemaDefinition[keyof ConfigSchemaDefinition];

@ApiSchema({ name: 'ConfigSchemaValue' })
export class ConfigSchemaValueDto {
  @ApiProperty({
    description: 'The label of the field',
    example: 'Name',
  })
  label: string;

  @ApiProperty({
    description: 'The field type',
    example: 'string',
  })
  type: string;

  @ApiProperty({
    description:
      'The allowed values for the field, if the field type is a string',
    example: ['apple', 'banana', 'cherry'],
    nullable: true,
  })
  enum: string[] | null;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  required: boolean;

  @ApiProperty({
    description: 'A description of the field',
    example: 'The name of the user',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'A placeholder for the field',
    example: 'John Doe',
    nullable: true,
  })
  placeholder: string | null;

  @ApiProperty({
    description:
      'The minimum allowable length of the field, if the field type supports length constraints',
    example: 1,
    default: null,
    nullable: true,
  })
  minLength: number | null;

  @ApiProperty({
    description:
      'The maximum allowable length of the field, if the field type supports length constraints',
    example: 10,
    default: null,
    nullable: true,
  })
  maxLength: number | null;

  @ApiProperty({
    description: 'Whether the field is immutable',
    example: true,
    nullable: true,
  })
  immutable: boolean | null;

  @ApiProperty({
    description: 'The item schema, if the field type is an array',
    type: () => ConfigSchemaItemsDto,
    nullable: true,
  })
  items: ConfigSchemaItemsDto | null;

  @ApiProperty({
    description: 'The properties of the field, if the field type is an object',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath('ConfigSchemaValue'),
    },
  })
  properties: ConfigSchemaForDto;

  constructor(data: ConfigSchemaValueParams) {
    this.label = data.label;
    this.type = data.type;
    this.enum = data.enum ?? null;
    this.required = data.required ?? false;
    this.description = data.description ?? null;
    this.placeholder = data.placeholder ?? null;
    this.minLength = data.minLength ?? null;
    this.maxLength = data.maxLength ?? null;
    this.items = data.items ? new ConfigSchemaItemsDto(data.items) : null;
    this.properties = data.properties
      ? toConfigSchemaForDto(data.properties)
      : {};
    this.immutable = data.immutable ?? null;
  }
}
