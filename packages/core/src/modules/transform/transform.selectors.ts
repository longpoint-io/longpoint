import { Prisma } from '@/database';

export const selectTransformerTemplate = () => {
  return {
    id: true,
    name: true,
    displayName: true,
    description: true,
    input: true,
    transformerId: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.TransformerTemplateSelect;
};

export type SelectedTransformerTemplate = Prisma.TransformerTemplateGetPayload<{
  select: ReturnType<typeof selectTransformerTemplate>;
}>;
