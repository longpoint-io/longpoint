import { Prisma } from '@/database';

export const selectCollection = () => {
  return {
    id: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    _count: {
      select: {
        containers: true,
      },
    },
  } satisfies Prisma.CollectionSelect;
};

export type SelectedCollection = Prisma.CollectionGetPayload<{
  select: ReturnType<typeof selectCollection>;
}>;
