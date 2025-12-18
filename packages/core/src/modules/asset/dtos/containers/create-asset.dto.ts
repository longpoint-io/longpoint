import { SupportedMimeType } from '@longpoint/types';
import { IsValidAssetName } from '@longpoint/validations';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export type CreateAssetParam = {
  name: string;
  mimeType: SupportedMimeType;
  storageUnitId?: string;
  collectionIds?: string[];
};

@ApiSchema({ name: 'CreateAsset' })
export class CreateAssetDto {
  @IsValidAssetName()
  @ApiProperty({
    description: 'A descriptive name for the underlying asset',
    example: 'Blissful Fields',
  })
  name!: string;

  @IsEnum(SupportedMimeType)
  @ApiProperty({
    description: 'The MIME type of the primary variant',
    example: SupportedMimeType.JPEG,
    enum: SupportedMimeType,
  })
  mimeType!: SupportedMimeType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'The ID of the storage unit to use. If not provided, the default storage unit will be used.',
    example: 'mbjq36xe6397dsi6x9nq4ghc',
  })
  storageUnitId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'IDs of collections the asset is a member of.',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  collectionIds?: string[];
}
