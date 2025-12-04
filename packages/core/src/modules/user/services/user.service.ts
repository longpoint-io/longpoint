import { Prisma } from '@/database';
import { PrismaService } from '@/modules/common/services';
import { RoleEntity } from '@/modules/role';
import { Injectable } from '@nestjs/common';
import { ListUsersQueryDto } from '../dtos/list-users-query.dto';
import { UserEntity } from '../entities/user.entity';
import { UserNotFound } from '../user.errors';
import { SelectedUser, selectUser } from '../user.selectors';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async listUsers(query?: ListUsersQueryDto) {
    const paginationOptions: Prisma.UserFindManyArgs = query?.toPrisma() ?? {
      orderBy: [{ id: Prisma.SortOrder.desc }],
    };
    const users = await this.prismaService.user.findMany({
      ...paginationOptions,
      select: selectUser(),
    });
    return users.map((user) => this.getUserEntity(user));
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: selectUser(),
    });

    if (!user) {
      return null;
    }

    return this.getUserEntity(user);
  }

  async getUserByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new UserNotFound(id);
    }
    return user;
  }

  private getUserEntity(user: SelectedUser) {
    return new UserEntity({
      ...user,
      roles: user.roles.map(
        (role) =>
          new RoleEntity({
            ...role,
            prismaService: this.prismaService,
          })
      ),
      prismaService: this.prismaService,
    });
  }
}
