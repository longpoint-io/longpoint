import { AssetGrid, AssetGridProps } from '@/components/asset-grid';
import { AssetTable } from '@/components/asset-table';
import { useClient } from '@/hooks/common/use-client';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { cn } from '@longpoint/ui/utils';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, SearchIcon, Table } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const VIEW_TYPE_STORAGE_KEY = 'browser-view-type';

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const client = useClient();
  const query = searchParams.get('q') || '';
  const [viewType, setViewType] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem(VIEW_TYPE_STORAGE_KEY);
    return (saved === 'grid' || saved === 'table' ? saved : 'grid') as
      | 'grid'
      | 'table';
  });

  useEffect(() => {
    localStorage.setItem(VIEW_TYPE_STORAGE_KEY, viewType);
  }, [viewType]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await client.search.searchAssets({ query });
      const links = await client.assets.generateLinks({
        assets: response.items.map((result) => ({
          assetId: result.id,
          w: 500,
        })),
      });
      return {
        results: response.items,
        links,
      };
    },
    enabled: !!query,
  });

  const results = data?.results || [];
  const isEmpty = !isLoading && results.length === 0 && query;

  const items: AssetGridProps['items'] = results.map((result) => ({
    treeItemType: 'MEDIA' as const,
    id: result.id,
    name: result.name,
    type: result.type,
    status: result.status,
    createdAt: result.createdAt,
    metadata: result.metadata,
    updatedAt: result.updatedAt,
    thumbnails: result.thumbnails,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Search Results</h1>
        {query && (
          <p className="text-lg text-muted-foreground">
            {results.length} {results.length === 1 ? 'result' : 'results'} for
            &quot;{query}&quot;
          </p>
        )}
      </div>

      {!query ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">Enter a search query</EmptyTitle>
              <EmptyDescription className="text-base">
                Use the search bar above to search for media containers.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              Failed to load search results
            </h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No results found</EmptyTitle>
              <EmptyDescription className="text-base">
                No media containers match your search query &quot;{query}&quot;.
                Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div
              role="radiogroup"
              aria-label="View type"
              className="flex flex-row gap-0.5 border rounded-md p-0.5 bg-muted/30"
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewType === 'grid'}
                aria-label="Grid view"
                onClick={() => setViewType('grid')}
                className={cn(
                  'size-8 flex items-center justify-center rounded transition-colors',
                  'hover:bg-muted/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  viewType === 'grid'
                    ? 'bg-background shadow-sm'
                    : 'bg-transparent'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewType === 'table'}
                aria-label="Table view"
                onClick={() => setViewType('table')}
                className={cn(
                  'size-8 flex items-center justify-center rounded transition-colors',
                  'hover:bg-muted/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  viewType === 'table'
                    ? 'bg-background shadow-sm'
                    : 'bg-transparent'
                )}
              >
                <Table className="h-4 w-4" />
              </button>
            </div>
          </div>
          {viewType === 'grid' ? (
            <AssetGrid
              items={items}
              isLoading={isLoading}
              links={data?.links || {}}
            />
          ) : (
            <AssetTable
              items={items}
              isLoading={isLoading}
              links={data?.links || {}}
            />
          )}
        </div>
      )}
    </div>
  );
}
