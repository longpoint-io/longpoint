import { Prisma } from '@/database';

export const selectAsset = () => {
  return {
    id: true,
    name: true,
    type: true,
    status: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
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
    displayName: true,
    status: true,
    assetId: true,
    entryPoint: true,
    mimeType: true,
    width: true,
    height: true,
    size: true,
    duration: true,
    metadata: true,
  } satisfies Prisma.AssetVariantSelect;
};

export type SelectedAssetVariant = Prisma.AssetVariantGetPayload<{
  select: ReturnType<typeof selectAssetVariant>;
}>;
