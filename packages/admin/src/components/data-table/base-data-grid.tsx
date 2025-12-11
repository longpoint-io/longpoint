import { Skeleton } from '@longpoint/ui/components/skeleton';
import React, { ReactNode } from 'react';

export interface BaseDataGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  isLoading?: boolean;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getItemId: (item: T) => string;
  gridClassName?: string;
  renderLoadingItem?: (index: number) => ReactNode;
}

export function BaseDataGrid<T>({
  items,
  renderItem,
  isLoading = false,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
  getItemId,
  gridClassName = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6',
  renderLoadingItem,
}: BaseDataGridProps<T>) {
  if (isLoading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: 12 }).map((_, index) =>
          renderLoadingItem ? (
            <React.Fragment key={index}>
              {renderLoadingItem(index)}
            </React.Fragment>
          ) : (
            <div key={index} className="space-y-3">
              <Skeleton className="w-full h-24 rounded-lg" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-3" />
            </div>
          )
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Empty state will be handled by parent
  }

  return (
    <div className={gridClassName}>
      {items.map(
        (item, index) =>
          // <React.Fragment key={getItemId(item)}>
          renderItem(item, index)
        // </React.Fragment>
      )}
    </div>
  );
}
