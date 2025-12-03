import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'RemoveAssetsFromCollection' })
export class RemoveAssetsFromCollectionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The IDs of the assets to remove from the collection',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  assetIds!: string[];
}

@ApiSchema({ name: 'AddAssetsToCollection' })
export class AddAssetsToCollectionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'The IDs of the assets to add to the collection',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  assetIds!: string[];
}
