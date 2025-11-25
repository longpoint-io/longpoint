import {
  ConfigSchemaItemsDto,
  ConfigSchemaValueDto,
  type ConfigSchemaForDto,
} from '@/shared/dtos';
import { SelectedClassifier } from '@/shared/selectors/classifier.selectors';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { IsClassifierName } from '@longpoint/validations';
import {
  ApiExtraModels,
  ApiProperty,
  ApiSchema,
  getSchemaPath,
} from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { ClassificationProviderSummaryDto } from './classification-provider-summary.dto';

export interface ClassifierParams extends Omit<SelectedClassifier, 'modelId'> {
  provider: ClassificationProviderSummaryDto;
  modelInputSchema: ConfigSchemaDefinition;
}

@ApiSchema({ name: 'Classifier' })
@ApiExtraModels(ConfigSchemaValueDto, ConfigSchemaItemsDto)
export class ClassifierDto {
  @ApiProperty({
    description: 'The ID of the classifier',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @IsClassifierName()
  @ApiProperty({
    description: 'The name of the classifier',
    example: 'general-tagging',
  })
  name: string;

  @ApiProperty({
    description: 'A brief description of the classifier',
    example: 'Tag general subjects like people, places, and things',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string | null;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'The input values to use for the model',
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
    description: 'The classification provider used by the classifier',
    type: ClassificationProviderSummaryDto,
  })
  provider: ClassificationProviderSummaryDto;

  @ApiProperty({
    description: 'When the classifier was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the classifier was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(data: ClassifierParams) {
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
