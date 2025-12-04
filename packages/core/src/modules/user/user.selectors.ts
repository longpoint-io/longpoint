import { Prisma } from '@/database';
import { selectRoleDetails, selectRoleReference } from '../role';

export const selectUser = () => {
  return {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    roles: {
      select: selectRoleDetails(),
    },
  } satisfies Prisma.UserSelect;
};

export type SelectedUser = Prisma.UserGetPayload<{
  select: ReturnType<typeof selectUser>;
}>;

export const selectUserRegistration = () => {
  return {
    id: true,
    email: true,
    createdAt: true,
    expiresAt: true,
    roles: {
      select: selectRoleReference(),
    },
  } satisfies Prisma.UserRegistrationSelect;
};

export type SelectedUserRegistration = Prisma.UserRegistrationGetPayload<{
  select: ReturnType<typeof selectUserRegistration>;
}>;
