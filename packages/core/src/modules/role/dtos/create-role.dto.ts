import { Permission } from '@longpoint/types';
import {
  IsPermissionSet,
  IsRoleDescription,
  IsRoleName,
} from '@longpoint/validations';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

@ApiSchema({ name: 'CreateRole' })
export class CreateRoleDto {
  @IsRoleName()
  @ApiProperty({
    description: 'The name of the role',
    example: 'Manager',
  })
  name!: string;

  @IsOptional()
  @IsRoleDescription()
  @ApiPropertyOptional({
    description: 'The description of the role',
    example: 'General asset manager',
  })
  description?: string;

  @Transform(({ value }) => Array.from(new Set(value)))
  @IsPermissionSet()
  @ApiProperty({
    description: 'The permissions the role has',
    enum: Permission,
    example: [
      Permission.ASSET_READ,
      Permission.ASSET_UPDATE,
      Permission.ASSET_DELETE,
    ],
  })
  permissions!: Permission[];
}
