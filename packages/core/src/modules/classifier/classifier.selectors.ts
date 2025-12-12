import { Prisma } from '@/database';

export const selectClassifierShort = () => {
  return {
    id: true,
    name: true,
    description: true,
  } satisfies Prisma.ClassifierTemplateSelect;
};

export const selectClassifierSummary = () => {
  return {
    ...selectClassifierShort(),
    createdAt: true,
    updatedAt: true,
    classifierId: true,
  } satisfies Prisma.ClassifierTemplateSelect;
};

export const selectClassifier = () => {
  return {
    ...selectClassifierSummary(),
    modelInput: true,
  } satisfies Prisma.ClassifierTemplateSelect;
};

export type SelectedClassifier = Prisma.ClassifierTemplateGetPayload<{
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
    classifierTemplate: {
      select: selectClassifierShort(),
    },
  } satisfies Prisma.ClassifierRunSelect;
};

export type SelectedClassifierRun = Prisma.ClassifierRunGetPayload<{
  select: ReturnType<typeof selectClassifierRun>;
}>;
