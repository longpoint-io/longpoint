import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export interface SystemStatusParams {
  totalAssets: number;
}

@ApiSchema({ name: 'SystemStatus' })
export class SystemStatusDto {
  @ApiProperty({
    description: 'Total number of ready assets',
    example: 150,
  })
  totalAssets: number;

  constructor(params: SystemStatusParams) {
    this.totalAssets = params.totalAssets;
  }
}
