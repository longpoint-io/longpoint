import { SelectedClassifier } from '@/modules/classifier/classifier.selectors';
import {
  ConfigSchemaItemsDto,
  ConfigSchemaValueDto,
  type ConfigSchemaForDto,
} from '@/shared/dtos';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { IsResourceName } from '@longpoint/validations/resource-identifiers';
import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { ClassifierSummaryDto } from './classifier-summary.dto';

export interface ClassifierTemplateParams
  extends Omit<SelectedClassifier, 'classifierId'> {
  provider: ClassifierSummaryDto;
  modelInputSchema: ConfigSchemaDefinition;
}

@ApiSchema({ name: 'ClassifierTemplate' })
@ApiExtraModels(ConfigSchemaValueDto, ConfigSchemaItemsDto)
export class ClassifierTemplateDto {
  @ApiProperty({
    description: 'The ID of the classifier template',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @IsResourceName('classifier-template')
  @ApiProperty({
    description: 'The name of the classifier template',
    example: 'general-tagging',
  })
  name: string;

  @ApiProperty({
    description: 'A brief description of the classifier template',
    example: 'Tag general subjects like people, places, and things',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'The input values to use for the classifier',
    example: {
      name: 'John Doe',
    },
  })
  modelInput?: ConfigValues | null;

  @ApiProperty({
    description: 'The schema for the classifier input',
    type: 'object',
    additionalProperties: {
      $ref: getSchemaPath(ConfigSchemaValueDto),
    },
    example: {
      name: {
        label: 'Name',
        type: 'string',
        required: true,
      },
    },
  })
  modelInputSchema: ConfigSchemaForDto;

  @ApiProperty({
    description: 'The classifier used by the classifier template',
    type: ClassifierSummaryDto,
  })
  provider: ClassifierSummaryDto;

  @ApiProperty({
    description: 'When the classifier template was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the classifier template was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: ClassifierTemplateParams) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.modelInput = data.modelInput as ConfigValues | null;
    this.provider = data.provider;
    this.modelInputSchema = Object.entries(data.modelInputSchema).reduce(
      (acc, [key, value]) => {
        acc[key] = new ConfigSchemaValueDto(value);
        return acc;
      },
      {} as ConfigSchemaForDto
    );
  }
}
