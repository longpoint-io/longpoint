import { PrismaService } from '@/modules/common/services';
import { BaseError } from '@/shared/errors';
import { Serializable } from '@/shared/types/swagger.types';
import { ErrorCode, Permission } from '@longpoint/types';
import { HttpStatus } from '@nestjs/common';
import { RoleDetailsDto, RoleDto, RoleReferenceDto } from '../dtos';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { RoleAlreadyExists, RoleNotFoundError } from '../role.errors';
import { SelectedRoleDetails, selectRoleDetails } from '../role.selectors';

export interface RoleEntityArgs extends SelectedRoleDetails {
  prismaService: PrismaService;
}

export class RoleEntity implements Serializable {
  readonly id: string;
  private _name: string;
  private _description: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _permissions: Permission[];

  private readonly prismaService: PrismaService;

  constructor(args: RoleEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._description = args.description;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.prismaService = args.prismaService;
    this._permissions = args.permissions
      .map((p) => p.permission as Permission)
      .sort();
  }

  async update(data: UpdateRoleDto) {
    const {
      name: newName,
      description: newDescription,
      permissions: newPermissions,
    } = data;

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (newName) {
        const existingRole = await tx.role.findFirst({
          where: {
            name: {
              equals: newName,
              mode: 'insensitive',
            },
            id: { not: this.id },
          },
        });

        if (existingRole) {
          throw new RoleAlreadyExists(newName);
        }
      }

      try {
        return await tx.role.update({
          where: {
            id: this.id,
          },
          data: {
            name: newName,
            description: newDescription,
            permissions: {
              deleteMany: newPermissions ? {} : undefined,
              createMany: newPermissions
                ? {
                    data: newPermissions.map((permission) => ({
                      permission,
                    })),
                  }
                : undefined,
            },
          },
          select: selectRoleDetails(),
        });
      } catch (e) {
        if (PrismaService.isNotFoundError(e)) {
          throw new RoleNotFoundError(this.id);
        }
        throw e;
      }
    });

    this._name = updated.name;
    this._description = updated.description;
    this._updatedAt = updated.updatedAt;
    this._permissions = updated.permissions
      .map((p) => p.permission as Permission)
      .sort();
  }

  async delete() {
    if (this.permissions.includes(Permission.SUPER)) {
      throw new BaseError(
        ErrorCode.OPERATION_NOT_SUPPORTED,
        'Cannot delete a super role',
        HttpStatus.BAD_REQUEST
      );
    }

    await this.prismaService.$transaction(async (tx) => {
      const usersWithRole = await tx.user.findMany({
        where: {
          roles: {
            some: {
              id: this.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              roles: true,
            },
          },
        },
      });

      const usersWithOnlyThisRole = usersWithRole.filter(
        (u) => u._count.roles === 1
      );

      if (usersWithOnlyThisRole.length > 0) {
        throw new BaseError(
          ErrorCode.INVALID_INPUT,
          `Cannot delete the role '${this.name}' because it is the only role for ${usersWithOnlyThisRole.length} user(s)`,
          HttpStatus.BAD_REQUEST,
          {
            users: usersWithOnlyThisRole.map((u) => ({
              id: u.id,
              name: u.name,
            })),
          }
        );
      }

      await tx.rolePermission.deleteMany({
        where: {
          roleId: this.id,
        },
      });

      await tx.role.delete({
        where: {
          id: this.id,
        },
      });
    });
  }

  toReferenceDto() {
    return new RoleReferenceDto({
      id: this.id,
      name: this.name,
    });
  }

  toDto() {
    return new RoleDto({
      id: this.id,
      name: this.name,
      description: this.description,
    });
  }

  toDetailsDto() {
    return new RoleDetailsDto({
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      permissions: this.permissions,
    });
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get permissions(): Permission[] {
    return this._permissions;
  }
}
