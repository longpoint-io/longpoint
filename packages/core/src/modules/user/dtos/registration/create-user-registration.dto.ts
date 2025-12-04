import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEmail, IsString } from 'class-validator';

@ApiSchema({ name: 'CreateUserRegistration' })
export class CreateUserRegistrationDto {
  @IsEmail()
  @ApiProperty({
    description: 'The email address of the user',
    example: 'theo@example.com',
  })
  email!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({
    description: 'One or more role IDs to assign to the user',
    example: ['123', '456'],
    type: [String],
    minItems: 1,
  })
  roleIds!: string[];
}
