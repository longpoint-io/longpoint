import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';
import { type ConfigSchemaForDto } from './config-schema.types';
import { toConfigSchemaForDto } from './config-schema.utils';

type ConfigSchemaItemParams = Required<
  ConfigSchemaDefinition[keyof ConfigSchemaDefinition]
>['items'];

@ApiSchema({ name: 'ConfigSchemaItems' })
export class ConfigSchemaItemsDto {
  @ApiProperty({
    description: 'The field type of the items',
    example: 'string',
  })
  type: string;

  @ApiProperty({
    description: 'The properties of the items, if the items are objects',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath('ConfigSchemaValue'),
    },
  })
  properties: ConfigSchemaForDto;

  @ApiProperty({
    description: 'The minimum allowable length of the array',
    example: 1,
    default: null,
    nullable: true,
  })
  minLength: number | null;

  @ApiProperty({
    description: 'The maximum allowable length of the array',
    example: 10,
    default: null,
    nullable: true,
  })
  maxLength: number | null;

  constructor(data: ConfigSchemaItemParams) {
    this.type = data.type;
    this.minLength = data.minLength ?? null;
    this.maxLength = data.maxLength ?? null;
    this.properties = data.properties
      ? toConfigSchemaForDto(data.properties)
      : {};
  }
}
