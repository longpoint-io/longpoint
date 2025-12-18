import { PrismaService } from '@/modules/common/services';
import { RoleEntity } from '@/modules/role';
import { BaseError } from '@/shared/errors';
import { Serializable } from '@/shared/types/swagger.types';
import { ErrorCode } from '@longpoint/types';
import { HttpStatus } from '@nestjs/common';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserDto } from '../dtos/user.dto';
import { UserAlreadyExists, UserNotFound } from '../user.errors';
import { SelectedUser, selectUser } from '../user.selectors';

export interface UserEntityArgs
  extends Pick<SelectedUser, 'id' | 'createdAt' | 'name' | 'email'> {
  roles: RoleEntity[];
  prismaService: PrismaService;
}

export class UserEntity implements Serializable {
  readonly id: string;
  readonly createdAt: Date;
  private _name: string;
  private _email: string;
  private _roles: RoleEntity[];

  private readonly prismaService: PrismaService;

  constructor(args: UserEntityArgs) {
    this.id = args.id;
    this.createdAt = args.createdAt;
    this._name = args.name;
    this._email = args.email;
    this._roles = args.roles;
    this.prismaService = args.prismaService;
  }

  async update(data: UpdateUserDto) {
    const { email: newEmail, roleIds: newRoleIds } = data;

    const updated = await this.prismaService.$transaction(async (tx) => {
      if (newEmail) {
        const existingUser = await tx.user.findFirst({
          where: {
            email: {
              equals: newEmail,
              mode: 'insensitive',
            },
            id: { not: this.id },
          },
        });

        if (existingUser) {
          throw new UserAlreadyExists(newEmail);
        }
      }

      let rolesToConnect: { id: string }[] | undefined;
      if (newRoleIds !== undefined) {
        const deduplicatedRoleIds = Array.from(new Set(newRoleIds));
        const roles = await tx.role.findMany({
          where: {
            id: {
              in: deduplicatedRoleIds,
            },
          },
        });

        if (roles.length !== deduplicatedRoleIds.length) {
          const missingRoleIds = deduplicatedRoleIds.filter(
            (id) => !roles.some((role) => role.id === id)
          );
          throw new BaseError(
            ErrorCode.INVALID_INPUT,
            'One or more roles were not found',
            HttpStatus.BAD_REQUEST,
            { missingRoleIds }
          );
        }

        rolesToConnect = roles.map((role) => ({ id: role.id }));
      }

      try {
        return await tx.user.update({
          where: {
            id: this.id,
          },
          data: {
            email: newEmail,
            roles:
              rolesToConnect !== undefined
                ? {
                    set: rolesToConnect,
                  }
                : undefined,
          },
          select: selectUser(),
        });
      } catch (e) {
        if (PrismaService.isNotFoundError(e)) {
          throw new UserNotFound(this.id);
        }
        throw e;
      }
    });

    this._name = updated.name;
    this._email = updated.email;
    this._roles = updated.roles.map(
      (role) =>
        new RoleEntity({
          ...role,
          prismaService: this.prismaService,
        })
    );
  }

  async delete() {
    try {
      await this.prismaService.user.delete({
        where: { id: this.id },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new UserNotFound(this.id);
      }
      throw e;
    }
  }

  toDto() {
    return new UserDto({
      id: this.id,
      name: this._name,
      email: this._email,
      createdAt: this.createdAt,
      roles: this._roles.map((role) => role.toReferenceDto()),
    });
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get roles(): RoleEntity[] {
    return this._roles;
  }
}
