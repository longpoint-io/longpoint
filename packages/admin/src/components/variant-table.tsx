import { Skeleton } from '@longpoint/ui/components/skeleton';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { BaseDataTable } from './data-table/base-data-table';
import { VariantTableRow, type VariantWithType } from './variant-table-row';

export interface VariantTableProps {
  items: VariantWithType[];
  isLoading?: boolean;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onVariantClick?: (variantId: string) => void;
}

export function VariantTable({
  items,
  isLoading,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
  onVariantClick,
}: VariantTableProps) {
  const handleRowSelectionChange = (variantId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(variantId);
    } else {
      newSelection.delete(variantId);
    }
    onSelectionChange(newSelection);
  };

  const columns = [
    { header: 'Name' },
    { header: 'Type' },
    { header: 'Status' },
    { header: 'Dimensions' },
    { header: 'Size' },
  ];

  const renderRow = (variant: VariantWithType) => {
    return (
      <VariantTableRow
        variant={variant}
        multiSelect={multiSelect}
        selected={selectedIds.has(variant.id)}
        onSelectChange={(selected) =>
          handleRowSelectionChange(variant.id, selected)
        }
        onVariantClick={onVariantClick}
      />
    );
  };

  const renderLoadingRow = () => (
    <TableRow>
      {multiSelect && (
        <TableCell>
          <Skeleton className="size-4" />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  );

  return (
    <BaseDataTable
      items={items}
      columns={columns}
      renderRow={renderRow}
      isLoading={isLoading}
      multiSelect={multiSelect}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      getItemId={(variant) => variant.id}
      renderLoadingRow={renderLoadingRow}
    />
  );
}
