import { RoleReferenceDto } from '@/modules/role';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { SelectedUser } from '../user.selectors';

export type UserParams = Omit<SelectedUser, 'roles'> & {
  roles: RoleReferenceDto[];
};

@ApiSchema({ name: 'User' })
export class UserDto {
  @ApiProperty({
    description: 'The ID of the user',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'When the user was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The roles the user has',
    type: [RoleReferenceDto],
  })
  roles: RoleReferenceDto[];

  constructor(params: UserParams) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    this.createdAt = params.createdAt;
    this.roles = params.roles;
  }
}
