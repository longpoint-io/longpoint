import type { components } from '@longpoint/sdk';
import { Longpoint } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import { Checkbox } from '@longpoint/ui/components/checkbox';
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

type AddToCollectionComboboxProps = {
  client: Longpoint;
  asset: components['schemas']['AssetDetails'] | undefined;
  onApply: (collectionIds: string[]) => void;
  onClose: () => void;
};

export function AddToCollectionCombobox({
  client,
  asset,
  onApply,
  onClose,
}: AddToCollectionComboboxProps) {
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState<
    components['schemas']['Collection'][]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    Set<string>
  >(new Set());

  const currentCollectionIds = new Set(
    asset?.collections?.map((c) => c.id) || []
  );

  // Initialize selected collections with current ones
  useEffect(() => {
    if (asset?.collections) {
      setSelectedCollectionIds(new Set(asset.collections.map((c) => c.id)));
    }
  }, [asset]);

  // Get current collections (the ones the container is already in)
  const currentCollections = collections.filter((collection) =>
    currentCollectionIds.has(collection.id)
  );

  // Get available collections (not currently in)
  const availableCollections = collections.filter(
    (collection) => !currentCollectionIds.has(collection.id)
  );

  // Filter collections based on search
  const filterCollections = (cols: components['schemas']['Collection'][]) => {
    if (!search) return cols;
    return cols.filter((collection) =>
      collection.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredCurrentCollections = filterCollections(currentCollections);

  // When searching, show all matching additional collections
  // When not searching, show up to 5 additional collections
  const filteredAvailableCollections = filterCollections(availableCollections);
  const filteredAdditionalCollections = search
    ? filteredAvailableCollections
    : filteredAvailableCollections.slice(0, 5);

  const toggleCollection = (collectionId: string) => {
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client.collections
      .list({ pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setCollections(response.items || []);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching collections:', error);
        if (!cancelled) {
          setCollections([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const handleApply = () => {
    onApply(Array.from(selectedCollectionIds));
  };

  const hasChanges =
    Array.from(selectedCollectionIds).sort().join(',') !==
    Array.from(currentCollectionIds).sort().join(',');

  return (
    <div className="flex flex-col">
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search collections..."
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
              {filteredCurrentCollections.length > 0 && (
                <CommandGroup>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Current Collections
                  </div>
                  {filteredCurrentCollections.map((collection) => (
                    <CommandItem
                      key={collection.id}
                      value={collection.id}
                      onSelect={() => toggleCollection(collection.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          className="[&_svg]:!text-primary-foreground"
                          checked={selectedCollectionIds.has(collection.id)}
                          onCheckedChange={() =>
                            toggleCollection(collection.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-1">{collection.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filteredAdditionalCollections.length > 0 && (
                <CommandGroup>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Other Collections
                  </div>
                  {filteredAdditionalCollections.map((collection) => (
                    <CommandItem
                      key={collection.id}
                      value={collection.id}
                      onSelect={() => toggleCollection(collection.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox
                          className="[&_svg]:!text-primary-foreground"
                          checked={selectedCollectionIds.has(collection.id)}
                          onCheckedChange={() =>
                            toggleCollection(collection.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-1">{collection.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {filteredCurrentCollections.length === 0 &&
                filteredAdditionalCollections.length === 0 && (
                  <CommandEmpty>
                    {search
                      ? 'No collections found.'
                      : 'No collections available.'}
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
        <Button
          size="sm"
          onClick={handleApply}
          disabled={!hasChanges || isLoading}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
