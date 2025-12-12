import {
  ApiProperty,
  ApiSchema,
  IntersectionType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ClassifierTemplateDto } from './classifier-template.dto';

@ApiSchema({ name: 'CreateClassifierTemplate' })
export class CreateClassifierTemplateDto extends IntersectionType(
  PickType(ClassifierTemplateDto, ['name', 'description'] as const),
  PartialType(PickType(ClassifierTemplateDto, ['modelInput'] as const))
) {
  @IsString()
  @ApiProperty({
    description: 'The ID of the classifier to use for the classifier template',
    example: 'anthropic/claude-haiku-4-5-20251001',
  })
  classifierId!: string;
}
