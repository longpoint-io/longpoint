import { components } from '@longpoint/sdk';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { AssetGridItem } from './asset-grid-item';
import { BaseDataGrid } from './data-table/base-data-grid';

export interface AssetGridProps {
  items: components['schemas']['AssetSummary'][];
  isLoading?: boolean;
  links: Record<string, string>;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function AssetGrid({
  items,
  isLoading,
  links,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
}: AssetGridProps) {
  const handleItemSelectionChange = (itemId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange(newSelection);
  };

  const renderItem = (item: components['schemas']['AssetSummary']) => {
    return (
      <AssetGridItem
        item={item}
        thumbnailLink={item.type === 'IMAGE' ? links[item.id] : undefined}
        multiSelect={multiSelect}
        selected={selectedIds.has(item.id)}
        onSelectChange={(selected) =>
          handleItemSelectionChange(item.id, selected)
        }
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
      getItemId={(item) => item.id}
      gridClassName="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
      renderLoadingItem={renderLoadingItem}
    />
  );
}
