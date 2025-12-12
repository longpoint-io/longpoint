import { ConfigSchemaItemsDto, ConfigSchemaValueDto } from '@/shared/dtos';
import { ConfigValues } from '@longpoint/config-schema';
import { ApiExtraModels, ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ClassifierSource } from '../classifier.types';
import { ClassifierDto } from './classifier.dto';

export interface ClassifierTemplateReferenceParams {
  id: string;
  name: string;
}

@ApiSchema({ name: 'ClassifierTemplateReference' })
export class ClassifierTemplateReferenceDto {
  @ApiProperty({
    description: 'The ID of the classifier template',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the classifier template',
    example: 'general-tagging',
  })
  name: string;

  constructor(data: ClassifierTemplateReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export interface ClassifierTemplateParams
  extends ClassifierTemplateReferenceParams {
  description: string | null;
  source: ClassifierSource;
  input: ConfigValues | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  classifier: ClassifierDto;
}

@ApiSchema({ name: 'ClassifierTemplate' })
@ApiExtraModels(ConfigSchemaValueDto, ConfigSchemaItemsDto)
export class ClassifierTemplateDto extends ClassifierTemplateReferenceDto {
  @ApiProperty({
    description: 'The source of the classifier template definition',
    enum: ClassifierSource,
    example: ClassifierSource.PLUGIN,
  })
  source: ClassifierSource;

  @ApiProperty({
    description: 'A brief description of the classifier template',
    example: 'Tag general subjects like people, places, and things',
    nullable: true,
    type: 'string',
  })
  description: string | null;

  @ApiProperty({
    description: 'The input values to use for the classifier',
    example: {
      name: 'John Doe',
    },
  })
  input?: ConfigValues | null;

  @ApiProperty({
    description: 'The classifier used by the classifier template',
    type: ClassifierDto,
  })
  classifier: ClassifierDto;

  @ApiProperty({
    description:
      'When the classifier template was created (only for custom templates)',
    example: '2025-01-01T00:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  createdAt: Date | null;

  @ApiProperty({
    description:
      'When the classifier template was last updated (only for custom templates)',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  updatedAt: Date | null;

  constructor(data: ClassifierTemplateParams) {
    super(data);
    this.source = data.source;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.input = data.input as ConfigValues | null;
    this.classifier = data.classifier;
  }
}
