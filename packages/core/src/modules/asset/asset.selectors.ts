import { Prisma } from '@/database';
import { selectClassifierRun } from '@/modules/classifier';

export const selectAssetSummary = () => {
  return {
    id: true,
    name: true,
    type: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    variants: {
      select: selectAssetVariant(),
    },
  } satisfies Prisma.AssetSelect;
};

export type SelectedAssetSummary = Prisma.AssetGetPayload<{
  select: ReturnType<typeof selectAssetSummary>;
}>;

export const selectAsset = () => {
  return {
    ...selectAssetSummary(),
    variants: {
      select: selectAssetVariant(),
    },
  } satisfies Prisma.AssetSelect;
};

export type SelectedAsset = Prisma.AssetGetPayload<{
  select: ReturnType<typeof selectAsset>;
}>;

export const selectAssetVariant = () => {
  return {
    id: true,
    type: true,
    status: true,
    entryPoint: true,
    mimeType: true,
    width: true,
    height: true,
    size: true,
    aspectRatio: true,
    duration: true,
    metadata: true,
    classifierRuns: {
      select: selectClassifierRun(),
    },
  } satisfies Prisma.AssetVariantSelect;
};

export type SelectedAssetVariant = Prisma.AssetVariantGetPayload<{
  select: ReturnType<typeof selectAssetVariant>;
}>;
