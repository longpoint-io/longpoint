import { Permission } from '@longpoint/types';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import {
  SelectedRole,
  SelectedRoleDetails,
  SelectedRoleReference,
} from '../role.selectors';

export type RoleReferenceParams = SelectedRoleReference;

@ApiSchema({ name: 'RoleReference' })
export class RoleReferenceDto {
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

  constructor(data: RoleReferenceParams) {
    this.id = data.id;
    this.name = data.name;
  }
}

export type RoleParams = SelectedRole;

@ApiSchema({ name: 'Role' })
export class RoleDto extends RoleReferenceDto {
  @ApiProperty({
    description: 'The description of the role',
    example: 'Manage assets',
    type: String,
    nullable: true,
  })
  description: string | null;

  constructor(data: RoleParams) {
    super(data);
    this.description = data.description;
  }
}

export type RoleDetailsParams = Omit<SelectedRoleDetails, 'permissions'> & {
  permissions: Permission[];
};

@ApiSchema({ name: 'RoleDetails' })
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
      Permission.CLASSIFIERS_CREATE,
      Permission.CLASSIFIERS_READ,
      Permission.CLASSIFIERS_UPDATE,
      Permission.CLASSIFIERS_DELETE,
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
