import { type ConfigValues } from '@longpoint/config-schema';
import {
  IsDisplayName,
  IsResourceDescription,
  IsResourceName,
} from '@longpoint/validations/resource-identifiers';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

const RESOURCE_TYPE = 'transform template';

@ApiSchema({ name: 'CreateTransformTemplate' })
export class CreateTransformTemplateDto {
  @IsResourceName(RESOURCE_TYPE)
  @ApiProperty({
    description: 'The name of the transform template',
    example: 'ipod-video',
  })
  name!: string;

  @IsDisplayName(RESOURCE_TYPE)
  @ApiPropertyOptional({
    description: 'The display name of the transform template',
    example: 'iPod Video',
  })
  displayName?: string;

  @IsResourceDescription(RESOURCE_TYPE)
  @ApiPropertyOptional({
    description: 'A brief description of the transform template',
    example: 'Convert videos into a watchable format for 5th generation iPods',
    nullable: true,
    type: 'string',
  })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The input values passed to the transformer',
    type: 'object',
    additionalProperties: true,
    example: {
      dimensions: {
        width: 320,
        height: 240,
      },
    },
  })
  input?: ConfigValues;
}
