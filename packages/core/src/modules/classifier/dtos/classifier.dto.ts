import { ConfigSchemaValueDto } from '@/shared/dtos';
import {
  type ConfigSchemaForDto,
  toConfigSchemaForDto,
} from '@/shared/dtos/config-schema';
import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { SupportedMimeType } from '@longpoint/types';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';

export interface ClassifierReferenceParams {
  id: string;
  displayName: string | null;
}

@ApiSchema({ name: 'ClassifierReference' })
export class ClassifierReferenceDto {
  @ApiProperty({
    description: 'The ID of the classifier',
    example: 'openai/gpt-5-nano-2025-08-07',
  })
  id: string;

  @ApiProperty({
    description: 'The display name of the classifier',
    nullable: true,
    type: 'string',
  })
  displayName: string | null;

  constructor(data: ClassifierReferenceParams) {
    this.id = data.id;
    this.displayName = data.displayName ?? null;
  }
}

export interface ClassifierParams extends ClassifierReferenceParams {
  description?: string | null;
  supportedMimeTypes: string[];
  maxFileSize?: number;
  inputSchema: ConfigSchemaDefinition;
}

@ApiSchema({ name: 'Classifier' })
export class ClassifierDto extends ClassifierReferenceDto {
  @ApiProperty({
    description: 'A brief description of the classifier',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Supported MIME types',
    enum: SupportedMimeType,
    isArray: true,
    example: ['image/jpeg', 'image/png'],
  })
  supportedMimeTypes: string[];

  @ApiProperty({
    description: 'Maximum file size in bytes',
    example: 52428800,
    nullable: true,
    type: 'number',
  })
  maxFileSize: number | null;

  @ApiProperty({
    description: 'The schema for the classifier input',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(ConfigSchemaValueDto),
    },
  })
  inputSchema: ConfigSchemaForDto;

  constructor(data: ClassifierParams) {
    super(data);
    this.description = data.description ?? null;
    this.supportedMimeTypes = data.supportedMimeTypes;
    this.maxFileSize = data.maxFileSize ?? null;
    this.inputSchema = toConfigSchemaForDto(data.inputSchema);
  }
}
