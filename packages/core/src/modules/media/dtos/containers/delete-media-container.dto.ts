import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

@ApiSchema({ name: 'DeleteMediaContainer' })
export class DeleteMediaContainerDto {
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether to permanently delete the media container',
    example: false,
    default: false,
    type: Boolean,
  })
  permanently = false;
}
