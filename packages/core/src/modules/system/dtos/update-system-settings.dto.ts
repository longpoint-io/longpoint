import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'UpdateSystemSettings' })
export class UpdateSystemSettingsDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The name of the system',
    example: 'My Assets',
    type: 'string',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'The ID of the image asset to use as the system logo',
    example: 'fjeialpj8m1u9h28k4jig182',
    type: 'string',
  })
  logoAssetId?: string;
}
