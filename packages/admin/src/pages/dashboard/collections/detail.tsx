import { MediaGrid } from '@/components/media-grid';
import { MediaTable } from '@/components/media-table';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@longpoint/ui/components/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import {
  InputGroup,
  InputGroupTextarea,
} from '@longpoint/ui/components/input-group';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@longpoint/ui/components/tooltip';
import { cn } from '@longpoint/ui/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  EditIcon,
  ImageIcon,
  LayoutGrid,
  ListXIcon,
  Table,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

const VIEW_TYPE_STORAGE_KEY = 'collection-detail-view-type';

const editFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeContainersDialogOpen, setRemoveContainersDialogOpen] =
    useState(false);
  const [selectedContainerIds, setSelectedContainerIds] = useState<Set<string>>(
    new Set()
  );
  const [viewType, setViewType] = useState<'grid' | 'table'>(() => {
    const saved = localStorage.getItem(VIEW_TYPE_STORAGE_KEY);
    return (saved === 'grid' || saved === 'table' ? saved : 'grid') as
      | 'grid'
      | 'table';
  });

  useEffect(() => {
    localStorage.setItem(VIEW_TYPE_STORAGE_KEY, viewType);
  }, [viewType]);

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const {
    data: collection,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => client.collections.getCollection(id!),
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

  // Reset form when collection loads or dialog opens
  useEffect(() => {
    if (collection && editDialogOpen) {
      editForm.reset({
        name: collection.name,
        description: collection.description || '',
      });
    }
  }, [collection, editDialogOpen, editForm]);

  const deleteMutation = useMutation({
    mutationFn: () => client.collections.deleteCollection(id!),
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

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      client.collections.updateCollection(id!, {
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      toast.success('Collection updated successfully');
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update collection', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const removeContainersMutation = useMutation({
    mutationFn: (containerIds: string[]) =>
      client.collections.removeContainersFromCollection(id!, {
        containerIds,
      }),
    onSuccess: () => {
      toast.success('Containers removed from collection successfully');
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      queryClient.invalidateQueries({
        queryKey: ['media-containers', 'collection', id],
      });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setSelectedContainerIds(new Set());
      setRemoveContainersDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to remove containers from collection', {
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

  const handleEdit = (data: EditFormData) => {
    updateMutation.mutate(data);
  };

  const handleRemoveContainers = () => {
    removeContainersMutation.mutate(Array.from(selectedContainerIds));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-96 w-full" />
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
              <Button variant="icon" onClick={() => setEditDialogOpen(true)}>
                <EditIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
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

      {/* Details Subheader */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">ID:</span>
          <span className="font-mono select-all">{collection.id}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-medium">Items:</span>
          <span>{collection.mediaContainerCount}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Created:</span>
          <span>{new Date(collection.createdAt).toLocaleString()}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Updated:</span>
          <span>{new Date(collection.updatedAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Media Containers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedContainerIds.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedContainerIds.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedContainerIds.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSelectedContainerIds(new Set())}
                  >
                    <ListXIcon />
                    Clear Selection
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setRemoveContainersDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove from collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
        </div>

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
                  This collection doesn't contain any media containers yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : viewType === 'grid' ? (
          <MediaGrid
            items={containers}
            links={links}
            isLoading={false}
            multiSelect={true}
            selectedIds={selectedContainerIds}
            onSelectionChange={setSelectedContainerIds}
          />
        ) : (
          <MediaTable
            items={containers}
            links={links}
            isLoading={false}
            multiSelect={true}
            selectedIds={selectedContainerIds}
            onSelectionChange={setSelectedContainerIds}
          />
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="collection-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="collection-name"
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="collection-description">
                      Description
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        {...field}
                        id="collection-description"
                        rows={4}
                        className="min-h-24 resize-none"
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateMutation.isPending || !editForm.formState.isDirty
                }
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

      <Dialog
        open={removeContainersDialogOpen}
        onOpenChange={setRemoveContainersDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Containers from Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-semibold">
                {selectedContainerIds.size} container
                {selectedContainerIds.size !== 1 ? 's' : ''}
              </span>{' '}
              from the collection{' '}
              <span className="font-semibold">{collection.name}</span>? This
              will not delete the containers, only remove them from this
              collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveContainersDialogOpen(false)}
              disabled={removeContainersMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveContainers}
              disabled={removeContainersMutation.isPending}
              isLoading={removeContainersMutation.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
