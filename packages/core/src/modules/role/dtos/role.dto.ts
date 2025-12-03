import { Permission } from '@longpoint/types';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { SelectedRole, SelectedRoleDetails } from '../role.selectors';

export type RoleParams = SelectedRole;

@ApiSchema({ name: 'Role' })
export class RoleDto {
  @ApiProperty({
    description: 'The ID of the role',
    example: 'sajl1kih6emtwozh8y0zenkj',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the role',
    example: 'Manager',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the role',
    example: 'Manage assets',
    nullable: true,
  })
  description: string | null;

  constructor(data: RoleParams) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
  }
}

export type RoleDetailsParams = Omit<SelectedRoleDetails, 'permissions'> & {
  permissions: Permission[];
};

export class RoleDetailsDto extends RoleDto {
  @ApiProperty({
    description: 'When the role was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the role was last updated',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The permissions the role has',
    enum: Permission,
    isArray: true,
    example: [
      Permission.CLASSIFIER_CREATE,
      Permission.CLASSIFIER_READ,
      Permission.CLASSIFIER_UPDATE,
      Permission.CLASSIFIER_DELETE,
    ],
  })
  permissions: Permission[];

  constructor(data: RoleDetailsParams) {
    super(data);
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.permissions = Array.from(new Set(data.permissions)).sort();
  }
}
