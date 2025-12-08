import { type ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { SelectedTransformTemplate } from '../../transform.selectors';

export type TransformTemplateParams = Omit<
  SelectedTransformTemplate,
  'displayName'
> & {
  displayName: string;
};

@ApiSchema({ name: 'TransformTemplate' })
export class TransformTemplateDto {
  @ApiProperty({
    description: 'The ID of the transform template',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the transform template',
    example: 'ipod-video',
  })
  name: string;

  @ApiProperty({
    description: 'The display name of the transform template',
    example: 'iPod Video',
  })
  displayName: string;

  @ApiPropertyOptional({
    description: 'A brief description of the transform template',
    example: 'Convert videos to a watchable format for 5th generation iPods',
    nullable: true,
    type: 'string',
  })
  description: string | null;

  @ApiProperty({
    description: 'The ID of the transformer the template uses',
    example: 'video/transcoder',
  })
  transformerId: string;

  @ApiProperty({
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
  input: ConfigValues;

  constructor(params: TransformTemplateParams) {
    this.id = params.id;
    this.name = params.name;
    this.displayName = params.displayName;
    this.description = params.description;
    this.transformerId = params.transformerId;
    this.input = params.input as ConfigValues;
  }
}
