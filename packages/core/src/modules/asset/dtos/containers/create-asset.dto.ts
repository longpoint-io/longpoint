import { SupportedMimeType } from '@longpoint/types';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { AssetDto } from './asset.dto';

export type CreateAssetParam = Pick<AssetDto, 'name'> & {
  mimeType: SupportedMimeType;
};

@ApiSchema({ name: 'CreateAsset' })
export class CreateAssetDto extends PartialType(
  PickType(AssetDto, ['name'] as const)
) {
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
    description:
      'Names of classifiers to run on the uploaded variant after processing',
    example: ['general-tagging'],
    type: [String],
  })
  classifiersOnUpload?: string[];

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
