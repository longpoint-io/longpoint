import { components } from '@longpoint/sdk';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@longpoint/ui/components/table';
import { AssetTableRow } from './asset-table-row';

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
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const newSelection = new Set(items.map((item) => item.id));
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(new Set());
    }
  };

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

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {multiSelect && <TableHead className="w-12" />}
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow key={index}>
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
          ))}
        </TableBody>
      </Table>
    );
  }

  if (items.length === 0) {
    return null; // Empty state will be handled by parent
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {multiSelect && (
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <AssetTableRow
            key={item.id}
            item={item}
            thumbnailLink={item.type === 'IMAGE' ? links[item.id] : undefined}
            multiSelect={multiSelect}
            selected={selectedIds.has(item.id)}
            onSelectChange={(selected) =>
              handleRowSelectionChange(item.id, selected)
            }
          />
        ))}
      </TableBody>
    </Table>
  );
}
