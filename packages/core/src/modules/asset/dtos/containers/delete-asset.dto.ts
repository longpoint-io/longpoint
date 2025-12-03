import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

@ApiSchema({ name: 'DeleteAsset' })
export class DeleteAssetDto {
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether to permanently delete the asset',
    example: false,
    default: false,
    type: Boolean,
  })
  permanently = false;
}
