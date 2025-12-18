import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { ConfigSchemaItemsDto } from './config-schema-items.dto';
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

  @ApiPropertyOptional({
    description:
      'The allowed values for the field, if the field type is a string',
    example: ['apple', 'banana', 'cherry'],
    nullable: true,
    type: [String],
  })
  enum?: string[] | null;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  required: boolean;

  @ApiProperty({
    description: 'A description of the field',
    example: 'The name of the user',
    nullable: true,
    type: 'string',
  })
  description: string | null;

  @ApiProperty({
    description: 'A placeholder for the field',
    example: 'John Doe',
    nullable: true,
    type: 'string',
  })
  placeholder: string | null;

  @ApiPropertyOptional({
    description:
      'The minimum allowable length of the field, if the field type supports length constraints',
    example: 1,
    default: null,
    nullable: true,
    type: 'number',
  })
  minLength?: number | null;

  @ApiPropertyOptional({
    description:
      'The maximum allowable length of the field, if the field type supports length constraints',
    example: 10,
    default: null,
    nullable: true,
    type: 'number',
  })
  maxLength?: number | null;

  @ApiProperty({
    description: 'Whether the field is immutable',
    example: true,
    type: 'boolean',
  })
  immutable: boolean;

  @ApiPropertyOptional({
    description: 'The item schema, if the field type is an array',
    type: () => ConfigSchemaItemsDto,
  })
  items?: ConfigSchemaItemsDto;

  @ApiPropertyOptional({
    description: 'The properties of the field, if the field type is an object',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath('ConfigSchemaValue'),
    },
  })
  properties?: ConfigSchemaForDto;

  constructor(data: ConfigSchemaValueParams) {
    this.label = data.label;
    this.type = data.type;
    this.enum = data.type === 'string' ? data.enum ?? null : undefined;
    this.required = data.required ?? false;
    this.description = data.description ?? null;
    this.placeholder = data.placeholder ?? null;
    this.minLength = this.getLengthValue(data, data.minLength);
    this.maxLength = this.getLengthValue(data, data.maxLength);
    this.items = data.items ? new ConfigSchemaItemsDto(data.items) : undefined;
    this.properties = data.properties
      ? toConfigSchemaForDto(data.properties)
      : undefined;
    this.immutable = data.immutable ?? false;
  }

  private getLengthValue(
    data: ConfigSchemaValueParams,
    propVal: number | undefined
  ) {
    if (['string', 'array'].includes(data.type)) {
      return propVal ?? null;
    }
    return undefined;
  }
}
