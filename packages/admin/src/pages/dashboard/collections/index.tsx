import { CollectionCard } from '@/components/collection-card';
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
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Plus, SquareLibraryIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateCollectionDialog } from './create-collection-dialog';

export function Collections() {
  const client = useClient();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['collections'],
    queryFn: () => client.media.listCollections(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Collections</h2>
            <p className="text-muted-foreground mt-2">
              Organize your media into collections
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Collections</h2>
            <p className="text-muted-foreground mt-2">
              Organize your media into collections
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load collections</p>
        </div>
      </div>
    );
  }

  const collections = data?.items || [];
  const isEmpty = collections.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Collections</h2>
          <p className="text-muted-foreground mt-2">
            Organize assets into collections
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SquareLibraryIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">
                No collections created yet
              </EmptyTitle>
              <EmptyDescription className="text-base">
                Get started by creating your first collection
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                <Plus className="h-5 w-5" />
                Create
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(collectionId) => {
          navigate(`/collections/${collectionId}`);
        }}
      />
    </div>
  );
}
