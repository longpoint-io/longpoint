import { ConfigSchemaValueDto } from '@/shared/dtos';
import {
  type ConfigSchemaForDto,
  toConfigSchemaForDto,
} from '@/shared/dtos/config-schema';
import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema, getSchemaPath } from '@nestjs/swagger';

export interface ClassifierParams {
  id: string;
  fullyQualifiedId: string;
  displayName: string;
  description?: string | null;
  supportedMimeTypes: string[];
  maxFileSize?: number;
  classifierInputSchema: ConfigSchemaDefinition;
  pluginId: string;
}

@ApiSchema({ name: 'Classifier' })
export class ClassifierDto {
  @ApiProperty({
    description: 'The ID of the classifier',
    example: 'gpt-5-nano-2025-08-07',
  })
  id: string;

  @ApiProperty({
    description: 'The fully qualified ID of the classifier',
    example: 'openai/gpt-5-nano-2025-08-07',
  })
  fullyQualifiedId: string;

  @ApiProperty({
    description: 'The display name of the classifier',
    example: 'GPT-5 Nano',
  })
  displayName: string;

  @ApiProperty({
    description: 'A brief description of the classifier',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Supported MIME types',
    type: [String],
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
  classifierInputSchema: ConfigSchemaForDto;

  @ApiProperty({
    description: 'The plugin ID that provides this classifier',
    example: 'openai',
  })
  pluginId: string;

  constructor(data: ClassifierParams) {
    this.id = data.id;
    this.fullyQualifiedId = data.fullyQualifiedId;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.supportedMimeTypes = data.supportedMimeTypes;
    this.maxFileSize = data.maxFileSize ?? null;
    this.classifierInputSchema = toConfigSchemaForDto(
      data.classifierInputSchema
    );
    this.pluginId = data.pluginId;
  }
}
