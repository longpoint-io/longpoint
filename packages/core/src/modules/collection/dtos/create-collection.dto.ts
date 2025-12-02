import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@ApiSchema({ name: 'CreateCollection' })
export class CreateCollectionDto {
  @IsString()
  @MaxLength(255)
  @ApiProperty({
    description: 'The name of the collection',
    example: '2025 Highlights',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @ApiPropertyOptional({
    description: 'The description of the collection',
    example: '2025 content highlights for annual showcase',
  })
  description?: string;
}
