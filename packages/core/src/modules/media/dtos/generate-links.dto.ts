import { TransformParamsDto } from '@/modules/file-delivery';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'GenerateAssetLink' })
export class GenerateAssetLinkDto extends TransformParamsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the asset',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  assetId!: string;
}

@ApiSchema({ name: 'GenerateMediaLinks' })
export class GenerateMediaLinksDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GenerateAssetLinkDto)
  @ApiProperty({
    description: 'The assets to generate links for',
    type: [GenerateAssetLinkDto],
  })
  assets!: GenerateAssetLinkDto[];
}
