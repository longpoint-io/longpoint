import { JsonObject } from '@/shared/types/object.types';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'UpdateAssetVariant' })
export class UpdateAssetVariantDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The display name of the asset variant',
    example: 'Original',
    type: 'string',
    nullable: true,
  })
  displayName?: string | null;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'Freeform metadata that can be populated by classifiers or manually edited',
    example: {
      'my-classifier': {
        tags: ['person', 'car', 'tree'],
      },
    },
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  metadata?: JsonObject | null;
}
