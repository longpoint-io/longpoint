import { Prisma } from '@/database';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleEntity } from './entities/role.entity';
import { RoleAlreadyExists, RoleNotFoundError } from './role.errors';
import { selectRoleDetails } from './role.selectors';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}

  async createRole(data: CreateRoleDto): Promise<RoleEntity> {
    const existingRole = await this.prismaService.role.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingRole) {
      throw new RoleAlreadyExists(data.name);
    }

    const role = await this.prismaService.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        permissions: {
          createMany: {
            data: data.permissions.map((permission) => ({
              permission,
            })),
          },
        },
      },
      select: selectRoleDetails(),
    });

    return new RoleEntity({
      ...role,
      prismaService: this.prismaService,
    });
  }

  async listRoles() {
    const roles = await this.prismaService.role.findMany({
      select: selectRoleDetails(),
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    });

    return roles.map(
      (r) =>
        new RoleEntity({
          ...r,
          prismaService: this.prismaService,
        })
    );
  }

  async getRoleById(id: string): Promise<RoleEntity | null> {
    const role = await this.prismaService.role.findUnique({
      where: { id },
      select: selectRoleDetails(),
    });

    if (!role) {
      return null;
    }

    return new RoleEntity({
      ...role,
      prismaService: this.prismaService,
    });
  }

  async getRoleByIdOrThrow(id: string): Promise<RoleEntity> {
    const role = await this.getRoleById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }
    return role;
  }
}
