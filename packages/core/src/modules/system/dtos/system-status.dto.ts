import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export interface SystemStatusParams {
  name: string;
  logoUrl: string | null;
  totalAssets: number;
}

@ApiSchema({ name: 'SystemStatus' })
export class SystemStatusDto {
  @ApiProperty({
    description: 'The name of the system',
    example: 'My Assets',
  })
  name: string;

  @ApiProperty({
    description: 'The URL of the system logo',
    example: 'https://longpoint.example.com/logo.png',
    nullable: true,
    type: 'string',
  })
  logoUrl: string | null;

  @ApiProperty({
    description: 'Total number of ready assets',
    example: 150,
  })
  totalAssets: number;

  constructor(params: SystemStatusParams) {
    this.name = params.name;
    this.logoUrl = params.logoUrl;
    this.totalAssets = params.totalAssets;
  }
}
