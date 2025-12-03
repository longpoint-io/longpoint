import { Prisma } from '@/database';

export const selectClassifierShort = () => {
  return {
    id: true,
    name: true,
    description: true,
  } satisfies Prisma.ClassifierSelect;
};

export const selectClassifierSummary = () => {
  return {
    ...selectClassifierShort(),
    createdAt: true,
    updatedAt: true,
    modelId: true,
  } satisfies Prisma.ClassifierSelect;
};

export const selectClassifier = () => {
  return {
    ...selectClassifierSummary(),
    modelInput: true,
  } satisfies Prisma.ClassifierSelect;
};

export type SelectedClassifier = Prisma.ClassifierGetPayload<{
  select: ReturnType<typeof selectClassifier>;
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
    classifier: {
      select: selectClassifierShort(),
    },
  } satisfies Prisma.ClassifierRunSelect;
};

export type SelectedClassifierRun = Prisma.ClassifierRunGetPayload<{
  select: ReturnType<typeof selectClassifierRun>;
}>;
