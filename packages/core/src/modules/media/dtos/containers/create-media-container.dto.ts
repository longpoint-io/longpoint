import { SupportedMimeType } from '@longpoint/types';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiSchema,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaContainerDto } from './media-container.dto';

export type CreateMediaContainerParam = Pick<MediaContainerDto, 'name'> & {
  mimeType: SupportedMimeType;
};

@ApiSchema({ name: 'CreateMediaContainer' })
export class CreateMediaContainerDto extends PartialType(
  PickType(MediaContainerDto, ['name'] as const)
) {
  @IsEnum(SupportedMimeType)
  @ApiProperty({
    description: 'The MIME type of the primary asset',
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
      'Names of classifiers to run on the uploaded asset after processing',
    example: ['general-tagging'],
    type: [String],
  })
  classifiersOnUpload?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: 'IDs of collections the container is a member of.',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  collectionIds?: string[];
}
