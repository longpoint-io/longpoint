import {
  type ConfigSchemaForDto,
  ConfigSchemaValueDto,
  toConfigSchemaForDto,
} from '@/shared/dtos';
import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';

export interface TransformerParams {
  id: string;
  displayName: string;
  description: string | null;
  supportedMimeTypes: string[];
}

@ApiSchema({ name: 'Transformer' })
export class TransformerDto {
  @ApiProperty({
    description: 'The ID of the transformer',
    example: 'video/transcoder',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the transformer',
    example: 'Transcoder',
  })
  displayName: string;

  @ApiProperty({
    description: 'A brief description of the transformer',
    example: 'Convert videos to a variety of formats and qualities',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Supported MIME types',
    type: [String],
    example: ['video/mp4', 'video/mov'],
  })
  supportedMimeTypes: string[];

  constructor(data: TransformerParams) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.description = data.description;
    this.supportedMimeTypes = data.supportedMimeTypes;
  }
}

export interface TransformerDetailsParams extends TransformerParams {
  inputSchema: ConfigSchemaDefinition;
}

@ApiSchema({ name: 'TransformerDetails' })
export class TransformerDetailsDto extends TransformerDto {
  @ApiProperty({
    description: 'The schema for transformer inputs',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(ConfigSchemaValueDto),
    },
  })
  inputSchema: ConfigSchemaForDto;

  constructor(data: TransformerDetailsParams) {
    super(data);
    this.inputSchema = toConfigSchemaForDto(data.inputSchema);
  }
}
