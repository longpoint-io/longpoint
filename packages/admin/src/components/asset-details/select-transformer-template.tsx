import type { components } from '@longpoint/sdk';
import { Longpoint } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@longpoint/ui/components/command';
import { Spinner } from '@longpoint/ui/components/spinner';
import { useEffect, useState } from 'react';

type SelectTransformerTemplateProps = {
  client: Longpoint;
  selectedVariantMimeType: string;
  onSelect: (templateId: string) => void;
  onClose: () => void;
};

export function SelectTransformerTemplate({
  client,
  selectedVariantMimeType,
  onSelect,
  onClose,
}: SelectTransformerTemplateProps) {
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<
    components['schemas']['TransformerTemplate'][]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client.transformers
      .listTransformerTemplates({ pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setTemplates(response.items || []);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching transformer templates:', error);
        if (!cancelled) {
          setTemplates([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const filterTemplates = (
    tmpls: components['schemas']['TransformerTemplate'][]
  ) => {
    return tmpls.filter((template) => {
      if (!template.supportedMimeTypes.includes(selectedVariantMimeType)) {
        return false;
      }
      const matchesName = template.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDisplayName = template.displayName
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesDescription = template.description
        ?.toLowerCase()
        .includes(search.toLowerCase());
      return matchesName || matchesDisplayName || matchesDescription;
    });
  };

  const filteredTemplates = filterTemplates(templates);

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
  };

  return (
    <div className="flex flex-col">
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search transformer templates..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner className="h-4 w-4" />
            </div>
          ) : (
            <>
              {filteredTemplates.length > 0 ? (
                <CommandGroup>
                  {filteredTemplates.map((template) => (
                    <CommandItem
                      key={template.id}
                      value={template.id}
                      onSelect={() => handleSelect(template.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium">
                          {template.displayName || template.name}
                        </span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  {search
                    ? 'No transformer templates found.'
                    : 'No transformer templates available.'}
                </CommandEmpty>
              )}
            </>
          )}
        </CommandList>
      </Command>
      <div className="border-t p-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
