import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export interface ClassifierSummaryParams {
  id: string;
  fullyQualifiedId: string;
  displayName: string;
  description?: string | null;
  pluginId: string;
}

@ApiSchema({ name: 'ClassifierSummary' })
export class ClassifierSummaryDto {
  @ApiProperty({
    description: 'The ID of the classifier',
    example: 'gpt-5-nano-2025-08-07',
  })
  id: string;

  @ApiProperty({
    description: 'The fully qualified ID of the classifier',
    example: 'openai/gpt-5-nano-2025-08-07',
  })
  fullyQualifiedId: string;

  @ApiProperty({
    description: 'The display name of the classifier',
    example: 'GPT-5 Nano',
  })
  displayName: string;

  @ApiProperty({
    description: 'A brief description of the classifier',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'The plugin ID that provides this classifier',
    example: 'openai',
  })
  pluginId: string;

  constructor(data: ClassifierSummaryParams) {
    this.id = data.id;
    this.fullyQualifiedId = data.fullyQualifiedId;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.pluginId = data.pluginId;
  }
}

