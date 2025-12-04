import { DEFAULT_ROLES } from '@longpoint/types';
import { PrismaClient } from '../../generated/prisma/client';

export async function createDefaultRoles(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    for (const rolePreset of Object.values(DEFAULT_ROLES)) {
      await tx.role.upsert({
        where: {
          name: rolePreset.name,
        },
        create: {
          name: rolePreset.name,
          description: rolePreset.description,
          permissions: {
            createMany: {
              data: Object.entries(rolePreset.permissions).map(
                ([permission]) => ({
                  permission,
                })
              ),
            },
          },
        },
        update: {},
      });
    }
  });
}
