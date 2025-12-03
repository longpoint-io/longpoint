import { Permission } from '@longpoint/types';
import { PrismaClient } from '../../generated/prisma/client';

export async function createDefaultRoles(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    const { id: roleId } = await tx.role.upsert({
      where: {
        name: 'Super Admin',
      },
      create: {
        name: 'Super Admin',
      },
      update: {},
      select: {
        id: true,
      },
    });
    await tx.rolePermission.upsert({
      where: {
        roleId_permission: {
          roleId,
          permission: Permission.SUPER,
        },
      },
      create: {
        roleId,
        permission: Permission.SUPER,
      },
      update: {},
    });
  });
}
