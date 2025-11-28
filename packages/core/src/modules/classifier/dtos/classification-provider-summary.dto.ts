import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export interface ClassificationProviderSummaryParams {
  id: string;
  fullyQualifiedId: string;
  displayName: string;
  description?: string | null;
  pluginId: string;
}

@ApiSchema({ name: 'ClassificationProviderSummary' })
export class ClassificationProviderSummaryDto {
  @ApiProperty({
    description: 'The ID of the classification provider',
    example: 'gpt-5-nano-2025-08-07',
  })
  id: string;

  @ApiProperty({
    description: 'The fully qualified ID of the classification provider',
    example: 'openai/gpt-5-nano-2025-08-07',
  })
  fullyQualifiedId: string;

  @ApiProperty({
    description: 'The display name of the classification provider',
    example: 'GPT-5 Nano',
  })
  displayName: string;

  @ApiProperty({
    description: 'A brief description of the classification provider',
    type: 'string',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'The plugin ID that provides this classification provider',
    example: 'openai',
  })
  pluginId: string;

  constructor(data: ClassificationProviderSummaryParams) {
    this.id = data.id;
    this.fullyQualifiedId = data.fullyQualifiedId;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.pluginId = data.pluginId;
  }
}

