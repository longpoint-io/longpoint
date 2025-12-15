import { Prisma } from '@/database';

export const selectRule = () => {
  return {
    id: true,
    displayName: true,
    enabled: true,
    triggerEvent: true,
    condition: true,
    action: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.RuleSelect;
};

export type SelectedRule = Prisma.RuleGetPayload<{
  select: ReturnType<typeof selectRule>;
}>;
