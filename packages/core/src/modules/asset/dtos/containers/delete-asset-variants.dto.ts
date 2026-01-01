import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'DeleteAssetVariants' })
export class DeleteAssetVariantsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'The IDs of the asset variants to delete',
    example: ['r2qwyd76nvd98cu6ewg8ync2', 'mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  variantIds!: string[];
}
