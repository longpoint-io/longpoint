import { RoleReferenceDto } from '@/modules/role';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { SelectedUserRegistration } from '../../user.selectors';

export type UserRegistrationParams = SelectedUserRegistration;

@ApiSchema({ name: 'UserRegistration' })
export class UserRegistrationDto {
  @ApiProperty({
    description: 'The ID of the user registration',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'theo@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The date and time the user registration was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'The date and time the user registration expires, after which a new registration must be created.',
    example: '2025-01-01T00:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'The roles the user will be assigned to',
    type: [RoleReferenceDto],
  })
  roles: RoleReferenceDto[];

  constructor(params: UserRegistrationParams) {
    this.id = params.id;
    this.email = params.email;
    this.createdAt = params.createdAt;
    this.expiresAt = params.expiresAt;
    this.roles = params.roles.map((role) => new RoleReferenceDto(role));
  }
}
