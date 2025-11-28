import { Prisma } from '@/database';
import { selectClassifierRun } from './classifier.selectors';

export const selectMediaContainerSummary = () => {
  return {
    id: true,
    name: true,
    type: true,
    status: true,
    path: true,
    createdAt: true,
    assets: {
      select: selectMediaAsset(),
    },
  } satisfies Prisma.MediaContainerSelect;
};

export type SelectedMediaContainerSummary = Prisma.MediaContainerGetPayload<{
  select: ReturnType<typeof selectMediaContainerSummary>;
}>;

export const selectMediaContainer = () => {
  return {
    ...selectMediaContainerSummary(),
    assets: {
      select: selectMediaAsset(),
    },
  } satisfies Prisma.MediaContainerSelect;
};

export type SelectedMediaContainer = Prisma.MediaContainerGetPayload<{
  select: ReturnType<typeof selectMediaContainer>;
}>;

export const selectMediaAsset = () => {
  return {
    id: true,
    variant: true,
    status: true,
    mimeType: true,
    width: true,
    height: true,
    size: true,
    aspectRatio: true,
    metadata: true,
    classifierRuns: {
      select: selectClassifierRun(),
    },
  } satisfies Prisma.MediaAssetSelect;
};

export type SelectedMediaAsset = Prisma.MediaAssetGetPayload<{
  select: ReturnType<typeof selectMediaAsset>;
}>;
