import { ViewToggle } from '@/components/data-table/view-toggle';
import { VariantGrid } from '@/components/variant-grid';
import { VariantTable } from '@/components/variant-table';
import { type VariantWithType } from '@/components/variant-table-row';
import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@longpoint/ui/components/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { ChevronDown, ImageIcon, ListXIcon, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAssetDetailsStore } from './asset-details-store';
import { DeleteVariantsDialog } from './delete-variants-dialog';

type VariantsTabProps = {
  asset: components['schemas']['AssetDetails'];
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
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    new Set()
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
          </p>
          {selectedVariantIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              • {selectedVariantIds.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedVariantIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSelectedVariantIds(new Set())}
                >
                  <ListXIcon />
                  Clear Selection
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete{' '}
                  {selectedVariantIds.size === 1 ? 'variant' : 'variants'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ViewToggle
            value={viewType}
            onValueChange={setViewType}
            storageKey={VARIANTS_VIEW_TYPE_STORAGE_KEY}
          />
        </div>
      </div>
      {viewType === 'grid' ? (
        <VariantGrid
          items={variants}
          onVariantClick={handleVariantClick}
          multiSelect={true}
          selectedIds={selectedVariantIds}
          onSelectionChange={setSelectedVariantIds}
        />
      ) : (
        <VariantTable
          items={variants}
          onVariantClick={handleVariantClick}
          multiSelect={true}
          selectedIds={selectedVariantIds}
          onSelectionChange={setSelectedVariantIds}
        />
      )}
      <DeleteVariantsDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        variantIds={Array.from(selectedVariantIds)}
        assetId={asset.id}
      />
    </div>
  );
}
