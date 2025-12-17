import { TemplateSource } from '@/shared/types/template.types';
import { type ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { SelectedTransformerTemplate } from '../../transform.selectors';

export type TransformerTemplateParams = Omit<
  SelectedTransformerTemplate,
  'displayName' | 'createdAt' | 'updatedAt'
> & {
  displayName: string;
  supportedMimeTypes: string[];
  source: TemplateSource;
  createdAt: Date | null;
  updatedAt: Date | null;
};

@ApiSchema({ name: 'TransformerTemplate' })
export class TransformerTemplateDto {
  @ApiProperty({
    description: 'The ID of the transformer template',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the transformer template',
    example: 'ipod-video',
  })
  name: string;

  @ApiProperty({
    description: 'The display name of the transformer template',
    example: 'iPod Video',
  })
  displayName: string;

  @ApiPropertyOptional({
    description: 'A brief description of the transformer template',
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
    description: 'The supported MIME types as input to the transformer',
    type: [String],
    example: ['video/mp4', 'video/mov'],
  })
  supportedMimeTypes: string[];

  @ApiProperty({
    description: 'The source of the transformer template definition',
    enum: TemplateSource,
    example: TemplateSource.PLUGIN,
  })
  source: TemplateSource;

  @ApiPropertyOptional({
    description:
      'The date and time the transformer template was created (only for custom templates)',
    example: '2021-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  createdAt: Date | null;

  @ApiPropertyOptional({
    description:
      'The date and time the transformer template was updated (only for custom templates)',
    example: '2021-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  updatedAt: Date | null;

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

  constructor(params: TransformerTemplateParams) {
    this.id = params.id;
    this.name = params.name;
    this.displayName = params.displayName;
    this.description = params.description;
    this.transformerId = params.transformerId;
    this.input = params.input as ConfigValues;
    this.source = params.source;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.supportedMimeTypes = params.supportedMimeTypes;
  }
}
