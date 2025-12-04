import { Prisma } from '@/database';

export const selectRoleReference = () => {
  return {
    id: true,
    name: true,
  } satisfies Prisma.RoleSelect;
};

export type SelectedRoleReference = Prisma.RoleGetPayload<{
  select: ReturnType<typeof selectRoleReference>;
}>;

export const selectRole = () => {
  return {
    id: true,
    name: true,
    description: true,
  } satisfies Prisma.RoleSelect;
};

export type SelectedRole = Prisma.RoleGetPayload<{
  select: ReturnType<typeof selectRole>;
}>;

export const selectRoleDetails = () => {
  return {
    ...selectRole(),
    createdAt: true,
    updatedAt: true,
    permissions: {
      select: {
        permission: true,
      },
    },
  } satisfies Prisma.RoleSelect;
};

export type SelectedRoleDetails = Prisma.RoleGetPayload<{
  select: ReturnType<typeof selectRoleDetails>;
}>;
