import { LibraryBreadcrumb } from '@/components/library-breadcrumb';
import { MediaGrid } from '@/components/media-grid';
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
import { useQuery } from '@tanstack/react-query';
import { UploadIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openDialog } = useUploadContext();
  const client = useClient();

  const currentPath = searchParams.get('path') || '/';

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
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Library</h1>
          <p className="text-lg text-muted-foreground">
            Manage your media files and content library
          </p>
        </div>
        <Button onClick={handleUpload} size="lg" className="shrink-0">
          <UploadIcon className="h-5 w-5" />
          Upload Media
        </Button>
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
                  Upload Media
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
            </div>
            <MediaGrid
              items={items}
              links={data?.links || {}}
              isLoading={isLoading}
              onFolderClick={handleFolderClick}
            />
          </div>
        )
      ) : null}
    </div>
  );
}
