import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ImageFitMode, TransformParams } from '../file-delivery.types';

@ApiSchema({ name: 'TransformParams' })
export class TransformParamsDto implements TransformParams {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The width of the transformed image in pixels',
    example: 800,
  })
  w?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The height of the transformed image in pixels',
    example: 600,
  })
  h?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @ApiPropertyOptional({
    description:
      'The quality of the transformed image (1-100). Applies to JPEG and WebP formats only.',
    example: 80,
  })
  q?: number;

  @IsString()
  @IsIn(['webp', 'jpeg', 'jpg', 'png'])
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The output format of the transformed image',
    example: 'webp',
    enum: ['webp', 'jpeg', 'jpg', 'png'],
  })
  f?: string;

  @IsEnum(ImageFitMode)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'How the image should be resized to fit the dimensions',
    example: 'cover',
    enum: ImageFitMode,
  })
  fit?: ImageFitMode;
}
