import { MediaGrid } from '@/components/media-grid';
import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@longpoint/ui/components/tooltip';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, ImageIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: collection,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => client.media.getCollection(id!),
    enabled: !!id,
  });

  const { data: containersData, isLoading: isLoadingContainers } = useQuery({
    queryKey: ['media-containers', 'collection', id],
    queryFn: async () => {
      const results = await client.media.listMediaContainers({
        collectionIds: id ? [id] : undefined,
        pageSize: 100,
      });
      const links = await client.media.generateLinks({
        containers: results.items.map((item) => ({
          containerId: item.id,
          w: 500,
        })),
      });
      return { results, links };
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.media.deleteCollection(id!),
    onSuccess: () => {
      toast.success('Collection deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setDeleteDialogOpen(false);
      navigate('/collections');
    },
    onError: (error) => {
      toast.error('Failed to delete collection', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Collection Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The collection you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const containers = containersData?.results.items || [];
  const links = containersData?.links || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{collection.name}</h2>
          {collection.description && (
            <p className="text-muted-foreground mt-2">
              {collection.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="icon" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Media Containers Section */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Containers</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingContainers ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="w-full h-24 rounded-lg" />
                      <Skeleton className="w-3/4 h-4" />
                      <Skeleton className="w-1/2 h-3" />
                    </div>
                  ))}
                </div>
              ) : containers.length === 0 ? (
                <div className="py-12">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ImageIcon className="h-12 w-12" />
                      </EmptyMedia>
                      <EmptyTitle className="text-2xl">
                        No media in this collection
                      </EmptyTitle>
                      <EmptyDescription className="text-base">
                        This collection doesn't contain any media containers
                        yet.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                <MediaGrid items={containers} links={links} isLoading={false} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>ID</FieldLabel>
                  <p className="text-sm font-mono text-muted-foreground select-all">
                    {collection.id}
                  </p>
                </Field>
                <Field>
                  <FieldLabel>Containers</FieldLabel>
                  <p className="text-sm">
                    {collection.mediaContainerCount}{' '}
                    {collection.mediaContainerCount === 1
                      ? 'container'
                      : 'containers'}
                  </p>
                </Field>
                <Field>
                  <FieldLabel>Created</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(collection.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Updated</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(collection.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the collection{' '}
              <span className="font-semibold">{collection.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
