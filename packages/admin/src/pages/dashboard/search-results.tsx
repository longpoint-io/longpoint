import { MediaGrid, MediaGridProps } from '@/components/media-grid';
import { useClient } from '@/hooks/common/use-client';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const client = useClient();
  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await client.search.searchMedia({ query });
      const links = await client.media.generateLinks({
        containers: response.results.map((result) => ({
          containerId: result.id,
          w: 500,
        })),
      });
      return {
        results: response.results,
        links,
      };
    },
    enabled: !!query,
  });

  const results = data?.results || [];
  const isEmpty = !isLoading && results.length === 0 && query;

  const items: MediaGridProps['items'] = results.map((result) => ({
    treeItemType: 'MEDIA' as const,
    id: result.id,
    name: result.name,
    path: result.path,
    status: result.status,
    createdAt: result.createdAt,
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
          <MediaGrid
            items={items}
            isLoading={isLoading}
            links={data?.links || {}}
          />
        </div>
      )}
    </div>
  );
}
