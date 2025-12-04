import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ArrayMinSize, IsEmail, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'UpdateUser' })
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  email?: string;

  @IsOptional()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ApiPropertyOptional({
    description: 'One or more role IDs to assign to the user',
    example: ['123', '456'],
    type: [String],
  })
  roleIds?: string[];
}
