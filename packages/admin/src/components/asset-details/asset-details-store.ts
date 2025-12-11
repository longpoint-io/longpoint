import { create } from 'zustand';

export interface AssetDetailsStore {
  selectedVariantId: string;
  setSelectedVariantId: (id: string) => void;
  resetSelectedVariant: () => void;
}

export const useAssetDetailsStore = create<AssetDetailsStore>()((set) => ({
  selectedVariantId: 'original',
  setSelectedVariantId: (id: string) => set({ selectedVariantId: id }),
  resetSelectedVariant: () => set({ selectedVariantId: 'original' }),
}));
