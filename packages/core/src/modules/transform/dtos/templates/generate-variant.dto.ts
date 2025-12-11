import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'GenerateVariant' })
export class GenerateVariantDto {
  @IsString()
  @ApiProperty({
    description: 'The ID of the source asset variant to transform',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  sourceVariantId!: string;
}
