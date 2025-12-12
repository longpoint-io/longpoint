'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@longpoint/ui/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@longpoint/ui/components/popover';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { cn } from '@longpoint/ui/utils';
import { useQuery } from '@tanstack/react-query';

export type ClassifierComboboxProps = {
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayed?: number;
};

export function ClassifierCombobox({
  value,
  onChange,
  placeholder = 'Select classifier(s)...',
  className,
  disabled,
  maxDisplayed = 2,
}: ClassifierComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string[]>(
    value ?? []
  );
  const selectedValues = value ?? internalValue;

  React.useEffect(() => {
    if (value) {
      setInternalValue(value);
    }
  }, [value]);

  const client = useClient();
  const { data: classifiers, isLoading: modelsLoading } = useQuery({
    queryKey: ['classifier-templates'],
    queryFn: () => client.classifiers.listClassifierTemplates(),
  });

  if (!classifiers || modelsLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const options = classifiers.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const valueToLabel = new Map(options.map((o) => [o.value, o.label]));

  const setSelected = (next: string[]) => {
    onChange?.(next);
    if (value === undefined) {
      setInternalValue(next);
    }
  };

  const toggleValue = (v: string) => {
    const isSelected = selectedValues.includes(v);
    const next = isSelected
      ? selectedValues.filter((x) => x !== v)
      : [...selectedValues, v];
    setSelected(next);
  };

  const triggerText = () => {
    if (!selectedValues.length) return placeholder;
    const labels = selectedValues
      .map((v) => valueToLabel.get(v))
      .filter(Boolean) as string[];
    if (labels.length <= maxDisplayed) return labels.join(', ');
    return `${labels.length} selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-[240px] justify-between', className)}
        >
          {triggerText()}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search classifiers..." className="h-9" />
          <CommandList>
            <CommandEmpty>No classifiers found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggleValue(opt.value)}
                  >
                    {valueToLabel.get(opt.value) ?? opt.label}
                    <Check
                      className={cn(
                        'ml-auto',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
