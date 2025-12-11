import { Skeleton } from '@longpoint/ui/components/skeleton';
import { BaseDataGrid } from './data-table/base-data-grid';
import { VariantGridItem } from './variant-grid-item';
import { type VariantWithType } from './variant-table-row';

export interface VariantGridProps {
  items: VariantWithType[];
  isLoading?: boolean;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onVariantClick?: (variantId: string) => void;
}

export function VariantGrid({
  items,
  isLoading,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
  onVariantClick,
}: VariantGridProps) {
  const handleItemSelectionChange = (variantId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(variantId);
    } else {
      newSelection.delete(variantId);
    }
    onSelectionChange(newSelection);
  };

  const renderItem = (variant: VariantWithType) => {
    return (
      <VariantGridItem
        variant={variant}
        multiSelect={multiSelect}
        selected={selectedIds.has(variant.id)}
        onSelectChange={(selected) =>
          handleItemSelectionChange(variant.id, selected)
        }
        onVariantClick={onVariantClick}
      />
    );
  };

  const renderLoadingItem = () => (
    <div className="space-y-3">
      <Skeleton className="w-full h-24 rounded-lg" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-3" />
    </div>
  );

  return (
    <BaseDataGrid
      items={items}
      renderItem={renderItem}
      isLoading={isLoading}
      multiSelect={multiSelect}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      getItemId={(variant) => variant.id}
      gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
      renderLoadingItem={renderLoadingItem}
    />
  );
}
