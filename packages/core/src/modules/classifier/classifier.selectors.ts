import { Prisma } from '@/database';

export const selectClassifierReference = () => {
  return {
    id: true,
    name: true,
  } satisfies Prisma.ClassifierTemplateSelect;
};

export const selectClassifierTemplate = () => {
  return {
    ...selectClassifierReference(),
    description: true,
    createdAt: true,
    updatedAt: true,
    classifierId: true,
    input: true,
  } satisfies Prisma.ClassifierTemplateSelect;
};

export type SelectedClassifierTemplate = Prisma.ClassifierTemplateGetPayload<{
  select: ReturnType<typeof selectClassifierTemplate>;
}>;

export const selectClassifierRun = () => {
  return {
    id: true,
    status: true,
    result: true,
    errorMessage: true,
    createdAt: true,
    startedAt: true,
    completedAt: true,
  } satisfies Prisma.ClassifierRunSelect;
};

export type SelectedClassifierRun = Prisma.ClassifierRunGetPayload<{
  select: ReturnType<typeof selectClassifierRun>;
}>;
