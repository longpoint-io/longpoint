import { components } from '@longpoint/sdk';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { TableCell, TableRow } from '@longpoint/ui/components/table';
import { AssetTableRow } from './asset-table-row';
import { BaseDataTable } from './data-table/base-data-table';

export interface AssetTableProps {
  items: components['schemas']['AssetSummary'][];
  isLoading?: boolean;
  links: Record<string, string>;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function AssetTable({
  items,
  isLoading,
  links,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
}: AssetTableProps) {
  const handleRowSelectionChange = (itemId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (selected) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange(newSelection);
  };

  const columns = [
    { header: 'Name' },
    { header: 'Type' },
    { header: 'Updated' },
    { header: 'Created' },
  ];

  const renderRow = (item: components['schemas']['AssetSummary']) => {
    return (
      <AssetTableRow
        item={item}
        thumbnailLink={item.type === 'IMAGE' ? links[item.id] : undefined}
        multiSelect={multiSelect}
        selected={selectedIds.has(item.id)}
        onSelectChange={(selected) =>
          handleRowSelectionChange(item.id, selected)
        }
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
        <Skeleton className="h-4 w-32" />
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
      getItemId={(item) => item.id}
      renderLoadingRow={renderLoadingRow}
    />
  );
}
