'use client';

import { Plus, XIcon } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@longpoint/ui/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@longpoint/ui/components/popover';
import { cn } from '@longpoint/ui/lib/utils';

export interface ItemPickerItem {
  id: string;
  name: string;
}

interface ItemPickerComboboxProps<T extends ItemPickerItem> {
  items: T[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  itemLabel?: string;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ItemPickerCombobox<T extends ItemPickerItem>({
  items,
  selectedIds,
  onSelectionChange,
  itemLabel = 'Item',
  placeholder,
  emptyMessage,
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
}: ItemPickerComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedItems = React.useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const availableItems = React.useMemo(
    () =>
      items.filter(
        (item) =>
          !selectedIds.includes(item.id) &&
          item.name.toLowerCase().includes(search.toLowerCase())
      ),
    [items, selectedIds, search]
  );

  const handleSelect = (itemId: string) => {
    onSelectionChange([...selectedIds, itemId]);
    setSearch('');
    setOpen(false);
  };

  const handleRemove = (itemId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== itemId));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <Badge key={item.id} className="pr-1">
            {item.name}
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              disabled={disabled}
              className="ml-1 rounded-sm hover:bg-primary/20 focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <XIcon className="size-3" />
              <span className="sr-only">Remove {item.name}</span>
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              // size="sm"
              disabled={disabled || availableItems.length === 0}
              // className="h-6"
            >
              <Plus className="size-3 mr-1" />
              Add {itemLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {emptyMessage || `No ${itemLabel.toLowerCase()}s found.`}
                </CommandEmpty>
                {availableItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => handleSelect(item.id)}
                  >
                    {item.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {selectedItems.length === 0 && placeholder && (
        <p className="text-sm text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}
