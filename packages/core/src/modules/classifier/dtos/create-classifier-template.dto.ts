import { type ConfigValues } from '@longpoint/config-schema';
import {
  IsResourceDescription,
  IsResourceName,
} from '@longpoint/validations/resource-identifiers';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'CreateClassifierTemplate' })
export class CreateClassifierTemplateDto {
  @IsResourceName('classifier-template')
  @ApiProperty({
    description: 'The name of the classifier template',
    example: 'general-tagging',
  })
  name!: string;

  @IsString()
  @ApiProperty({
    description: 'The ID of the classifier to use for the classifier template',
    example: 'longpoint/metadata-extractor',
  })
  classifierId!: string;

  @IsResourceDescription('classifier-template')
  @ApiProperty({
    description: 'A brief description of the classifier template',
    example: 'Tag general subjects like people, places, and things',
    nullable: true,
  })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The input values passed to the classifier',
    type: 'object',
    additionalProperties: true,
    example: {
      name: 'John Doe',
    },
  })
  input?: ConfigValues;
}
