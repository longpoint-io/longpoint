import { cn } from '@longpoint/ui/utils';
import { LayoutGrid, Table } from 'lucide-react';
import { useEffect } from 'react';

export interface ViewToggleProps {
  value: 'grid' | 'table';
  onValueChange: (value: 'grid' | 'table') => void;
  storageKey?: string;
}

export function ViewToggle({
  value,
  onValueChange,
  storageKey = 'browser-view-type',
}: ViewToggleProps) {
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, value);
    }
  }, [value, storageKey]);

  return (
    <div
      role="radiogroup"
      aria-label="View type"
      className="flex flex-row gap-0.5 border rounded-md p-0.5 bg-muted/30"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'grid'}
        aria-label="Grid view"
        onClick={() => onValueChange('grid')}
        className={cn(
          'size-8 flex items-center justify-center rounded transition-colors',
          'hover:bg-muted/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'grid' ? 'bg-background shadow-sm' : 'bg-transparent'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'table'}
        aria-label="Table view"
        onClick={() => onValueChange('table')}
        className={cn(
          'size-8 flex items-center justify-center rounded transition-colors',
          'hover:bg-muted/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          value === 'table' ? 'bg-background shadow-sm' : 'bg-transparent'
        )}
      >
        <Table className="h-4 w-4" />
      </button>
    </div>
  );
}
