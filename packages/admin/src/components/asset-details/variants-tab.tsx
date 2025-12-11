import { ViewToggle } from '@/components/data-table/view-toggle';
import { VariantGrid } from '@/components/variant-grid';
import { VariantTable } from '@/components/variant-table';
import { type VariantWithType } from '@/components/variant-table-row';
import type { components } from '@longpoint/sdk';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAssetDetailsStore } from './asset-details-store';

type VariantsTabProps = {
  asset: components['schemas']['Asset'];
};

const VARIANTS_VIEW_TYPE_STORAGE_KEY = 'variants-view-type';

export function VariantsTab({ asset }: VariantsTabProps) {
  const { setSelectedVariantId } = useAssetDetailsStore();
  const [viewType, setViewType] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem(VARIANTS_VIEW_TYPE_STORAGE_KEY);
    return (saved === 'grid' || saved === 'table' ? saved : 'grid') as
      | 'grid'
      | 'table';
  });

  useEffect(() => {
    localStorage.setItem(VARIANTS_VIEW_TYPE_STORAGE_KEY, viewType);
  }, [viewType]);

  // Collect all variants with their types
  const variants: VariantWithType[] = useMemo(() => {
    const allVariants: VariantWithType[] = [];

    // Add original variant
    if (asset.original) {
      allVariants.push({
        ...asset.original,
        variantType: 'ORIGINAL' as const,
      });
    }

    // Add derivatives
    if (asset.derivatives) {
      asset.derivatives.forEach((derivative) => {
        allVariants.push({
          ...derivative,
          variantType: 'DERIVATIVE' as const,
        });
      });
    }

    // Add thumbnails
    if (asset.thumbnails) {
      asset.thumbnails.forEach((thumbnail) => {
        allVariants.push({
          ...thumbnail,
          variantType: 'THUMBNAIL' as const,
        });
      });
    }

    return allVariants;
  }, [asset]);

  const handleVariantClick = (variantId: string) => {
    // Determine if it's the original or a derivative/thumbnail
    if (variantId === asset.original?.id) {
      setSelectedVariantId('original');
    } else {
      setSelectedVariantId(variantId);
    }
  };

  if (variants.length === 0) {
    return (
      <div className="py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon className="h-12 w-12" />
            </EmptyMedia>
            <EmptyTitle className="text-2xl">No variants available</EmptyTitle>
            <EmptyDescription className="text-base">
              This asset doesn't have any variants yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
        </p>
        <ViewToggle
          value={viewType}
          onValueChange={setViewType}
          storageKey={VARIANTS_VIEW_TYPE_STORAGE_KEY}
        />
      </div>
      {viewType === 'grid' ? (
        <VariantGrid items={variants} onVariantClick={handleVariantClick} />
      ) : (
        <VariantTable items={variants} onVariantClick={handleVariantClick} />
      )}
    </div>
  );
}
