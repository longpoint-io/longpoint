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
import React, { ReactNode } from 'react';

export interface BaseDataTableColumn<T> {
  header: ReactNode;
  className?: string;
}

export interface BaseDataTableProps<T> {
  items: T[];
  columns: BaseDataTableColumn<T>[];
  renderRow: (item: T, index: number) => ReactNode;
  isLoading?: boolean;
  multiSelect?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  getItemId: (item: T) => string;
  renderLoadingRow?: (index: number) => ReactNode;
}

export function BaseDataTable<T>({
  items,
  columns,
  renderRow,
  isLoading = false,
  multiSelect = false,
  selectedIds = new Set(),
  onSelectionChange,
  getItemId,
  renderLoadingRow,
}: BaseDataTableProps<T>) {
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(getItemId(item)));

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const newSelection = new Set(items.map((item) => getItemId(item)));
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(new Set());
    }
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {multiSelect && <TableHead className="w-12" />}
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) =>
            renderLoadingRow ? (
              <React.Fragment key={index}>
                {renderLoadingRow(index)}
              </React.Fragment>
            ) : (
              <TableRow key={index}>
                {multiSelect && (
                  <TableCell>
                    <Skeleton className="size-4" />
                  </TableCell>
                )}
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                ))}
              </TableRow>
            )
          )}
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
          {columns.map((column, index) => (
            <TableHead key={index} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <React.Fragment key={getItemId(item)}>
            {renderRow(item, index)}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
