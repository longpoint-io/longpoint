import { type ConfigValues } from '@longpoint/config-schema';
import {
  IsDisplayName,
  IsResourceDescription,
  IsResourceName,
} from '@longpoint/validations/resource-identifiers';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

const RESOURCE_TYPE = 'transformer template';

@ApiSchema({ name: 'CreateTransformerTemplate' })
export class CreateTransformerTemplateDto {
  @IsResourceName(RESOURCE_TYPE)
  @ApiProperty({
    description: 'The name of the transformer template',
    example: 'ipod-video',
  })
  name!: string;

  @IsDisplayName(RESOURCE_TYPE)
  @ApiPropertyOptional({
    description: 'The display name of the transformer template',
    example: 'iPod Video',
  })
  displayName?: string;

  @IsResourceDescription(RESOURCE_TYPE)
  @ApiPropertyOptional({
    description: 'A brief description of the transformer template',
    example: 'Convert videos into a watchable format for 5th generation iPods',
    nullable: true,
    type: 'string',
  })
  description?: string;

  @IsString()
  @ApiProperty({
    description: 'The ID of the transformer to use',
    example: 'video/transcoder',
  })
  transformerId!: string;

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
