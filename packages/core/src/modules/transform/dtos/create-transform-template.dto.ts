import { type ConfigValues } from '@longpoint/config-schema';
import { IsSlug } from '@longpoint/validations';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'CreateTransformTemplate' })
export class CreateTransformTemplateDto {
  @IsSlug()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the transform template',
    example: 'iPod Video',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'A brief description of the transform template',
    example: 'Convert videos to a watchable format for 5th generation iPods',
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
