import { Prisma } from '@/database';

export const selectTransformTemplate = () => {
  return {
    id: true,
    name: true,
    displayName: true,
    description: true,
    input: true,
    transformerId: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.TransformTemplateSelect;
};

export type SelectedTransformTemplate = Prisma.TransformTemplateGetPayload<{
  select: ReturnType<typeof selectTransformTemplate>;
}>;
