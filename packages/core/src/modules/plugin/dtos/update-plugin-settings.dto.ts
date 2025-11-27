import type { ConfigValues } from '@longpoint/config-schema';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

@ApiSchema({ name: 'UpdatePluginSettings' })
export class UpdatePluginSettingsDto {
  @IsObject()
  @ApiProperty({
    description: 'The configuration values to update',
    type: 'object',
    additionalProperties: true,
    example: {
      apiKey: 'sk-1234567890',
    },
  })
  config!: ConfigValues;
}
