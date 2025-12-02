import { TransformParamsDto } from '@/modules/file-delivery';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

@ApiSchema({ name: 'GenerateContainerLink' })
export class GenerateContainerLinkDto extends TransformParamsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the media container',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  containerId!: string;
}

@ApiSchema({ name: 'GenerateMediaLinks' })
export class GenerateMediaLinksDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GenerateContainerLinkDto)
  @ApiProperty({
    description: 'The containers to generate links for',
    type: [GenerateContainerLinkDto],
  })
  containers!: GenerateContainerLinkDto[];
}
