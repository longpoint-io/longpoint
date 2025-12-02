import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'RemoveContainersFromCollection' })
export class RemoveContainersFromCollectionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty({
    description:
      'The IDs of the media containers to remove from the collection',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  containerIds!: string[];
}

@ApiSchema({ name: 'AddContainersToCollection' })
export class AddContainersToCollectionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty({
    description: 'The IDs of the media containers to add to the collection',
    example: ['mbjq36xe6397dsi6x9nq4ghc'],
    type: [String],
  })
  containerIds!: string[];
}
