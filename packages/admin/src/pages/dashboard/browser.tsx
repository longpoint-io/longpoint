import { LibraryBreadcrumb } from '@/components/library-breadcrumb';
import { MediaGrid } from '@/components/media-grid';
import { MediaTable } from '@/components/media-table';
import { useUploadContext } from '@/contexts/upload-context';
import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { cn } from '@longpoint/ui/utils';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Table, UploadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const VIEW_TYPE_STORAGE_KEY = 'browser-view-type';

export function Browser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openDialog } = useUploadContext();
  const client = useClient();
  const [viewType, setViewType] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem(VIEW_TYPE_STORAGE_KEY);
    return (saved === 'grid' || saved === 'table' ? saved : 'grid') as
      | 'grid'
      | 'table';
  });

  const currentPath = searchParams.get('path') || '/';

  useEffect(() => {
    localStorage.setItem(VIEW_TYPE_STORAGE_KEY, viewType);
  }, [viewType]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['library-tree', currentPath],
    queryFn: async () => {
      const tree = await client.media.getTree({ path: currentPath });
      const links = await client.media.generateLinks({
        containers: tree.items
          .filter((item) => item.treeItemType === 'MEDIA')
          .map((item) => ({
            containerId: item.id,
            w: 500,
          })),
      });
      return { tree, links };
    },
  });

  const handleFolderClick = (path: string) => {
    setSearchParams({ path });
  };

  const handleUpload = () => {
    openDialog();
  };

  const items = data?.tree.items || [];
  const isEmpty = !isLoading && items.length === 0 && currentPath === '/';

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Browser</h1>
      </div>

      {currentPath !== '/' && (
        <div className="border-b pb-6">
          <LibraryBreadcrumb currentPath={currentPath} />
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-destructive">
              Failed to load library contents
            </h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      )}

      {!error ? (
        isEmpty ? (
          <div className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UploadIcon className="h-12 w-12" />
                </EmptyMedia>
                <EmptyTitle className="text-2xl">
                  No media in your library
                </EmptyTitle>
                <EmptyDescription className="text-base">
                  Get started by uploading your first media files to organize
                  and manage your content.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleUpload} size="lg">
                  <UploadIcon className="h-5 w-5" />
                  Upload
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  {currentPath === '/'
                    ? 'All Items'
                    : `Items in ${currentPath.split('/').pop()}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
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
              <MediaGrid
                items={items}
                links={data?.links || {}}
                isLoading={isLoading}
                onFolderClick={handleFolderClick}
              />
            ) : (
              <MediaTable
                items={items}
                links={data?.links || {}}
                isLoading={isLoading}
                onFolderClick={handleFolderClick}
              />
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
