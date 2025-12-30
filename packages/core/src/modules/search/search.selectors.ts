import { Prisma } from '@/database';

export const selectSearchIndex = () => {
  return {
    id: true,
    name: true,
    active: true,
    indexing: true,
    lastIndexedAt: true,
    searchProviderId: true,
    embeddingModelId: true,
    config: true,
    _count: {
      select: {
        items: true,
      },
    },
  } satisfies Prisma.SearchIndexSelect;
};

export type SelectedSearchIndex = Prisma.SearchIndexGetPayload<{
  select: ReturnType<typeof selectSearchIndex>;
}>;
