import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common';
import { zodResolver } from '@hookform/resolvers/zod';
import type { components } from '@longpoint/sdk';
import { Longpoint } from '@longpoint/sdk';
import { Permission } from '@longpoint/types';
import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import { Card, CardContent, CardHeader } from '@longpoint/ui/components/card';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@longpoint/ui/components/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@longpoint/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { Spinner } from '@longpoint/ui/components/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@longpoint/ui/components/tooltip';
import { cn } from '@longpoint/ui/lib/utils';
import { formatBytes, formatDuration } from '@longpoint/utils/format';
import { enumToTitleCase } from '@longpoint/utils/string';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookmarkIcon,
  Download,
  EditIcon,
  ImageIcon,
  Sparkles,
  Trash2,
  VideoIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

type AddToCollectionComboboxProps = {
  client: Longpoint;
  asset: components['schemas']['Asset'] | undefined;
  onApply: (collectionIds: string[]) => void;
  onClose: () => void;
};

function AddToCollectionCombobox({
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
      .listCollections({ pageSize: 100 })
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

type SelectTransformTemplateProps = {
  client: Longpoint;
  selectedVariantMimeType: string;
  onSelect: (templateId: string) => void;
  onClose: () => void;
};

function SelectTransformTemplate({
  client,
  selectedVariantMimeType,
  onSelect,
  onClose,
}: SelectTransformTemplateProps) {
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<
    components['schemas']['TransformTemplate'][]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    client.transform
      .listTransformTemplates({ pageSize: 100 })
      .then((response) => {
        if (!cancelled) {
          setTemplates(response.items || []);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching transform templates:', error);
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
    tmpls: components['schemas']['TransformTemplate'][]
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
          placeholder="Search transform templates..."
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
                    ? 'No transform templates found.'
                    : 'No transform templates available.'}
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

export function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission(Permission.ASSETS_UPDATE);
  const canDelete = hasPermission(Permission.ASSETS_DELETE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentlyDelete, setPermanentlyDelete] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [generateVariantOpen, setGenerateVariantOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] =
    useState<string>('original');

  const renameFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
  });

  type RenameFormData = z.infer<typeof renameFormSchema>;

  const renameForm = useForm<RenameFormData>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assets', id],
    queryFn: () => client.assets.getAsset(id!),
    enabled: !!id,
  });

  // Reset form when media loads or dialog opens
  useEffect(() => {
    if (media && renameDialogOpen) {
      renameForm.reset({
        name: media.name,
      });
    }
  }, [media, renameDialogOpen, renameForm]);

  // Reset selected variant when media changes
  useEffect(() => {
    if (media) {
      setSelectedVariantId('original');
    }
  }, [media]);

  // Get the currently selected variant
  const selectedVariant =
    selectedVariantId === 'original'
      ? media?.original
      : media?.derivatives?.find((d) => d.id === selectedVariantId);

  const deleteMutation = useMutation({
    mutationFn: () =>
      client.assets.deleteAsset(id!, { permanently: permanentlyDelete }),
    onSuccess: () => {
      toast.success('Asset deleted');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setDeleteDialogOpen(false);
      setPermanentlyDelete(false);
      navigate('/assets');
    },
    onError: (error) => {
      toast.error('Failed to delete media', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (data: RenameFormData) =>
      client.assets.updateAsset(id!, { name: data.name }),
    onSuccess: () => {
      toast.success('Media renamed successfully');
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setRenameDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to rename media', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const updateCollectionsMutation = useMutation({
    mutationFn: (collectionIds: string[]) => {
      return client.assets.updateAsset(id!, { collectionIds });
    },
    onSuccess: () => {
      toast.success('Collections updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setAddToCollectionOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update collections', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const generateVariantMutation = useMutation({
    mutationFn: (templateId: string) => {
      const sourceVariantId = selectedVariant?.id;
      if (!sourceVariantId) {
        throw new Error('Selected variant not found');
      }
      return client.transform.generateVariantFromTemplate(templateId, {
        sourceVariantId,
      });
    },
    onSuccess: () => {
      toast.success('Variant generation started', {
        description: 'The variant is being generated. This may take a moment.',
      });
      queryClient.invalidateQueries({ queryKey: ['assets', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setGenerateVariantOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to generate variant', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleRename = (data: RenameFormData) => {
    renameMutation.mutate(data);
  };

  const handleDownload = async () => {
    if (selectedVariant?.url) {
      try {
        const response = await fetch(selectedVariant.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = media?.name || 'media';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        toast.error('Failed to download media', {
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      }
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const isVideo = media?.type === 'VIDEO';

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

  if (error || !media) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Media Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The media item you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'READY':
        return 'default';
      case 'PROCESSING':
        return 'secondary';
      case 'FAILED':
      case 'PARTIALLY_FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const hasDerivatives = media?.derivatives && media.derivatives.length > 0;
  const variantOptions = [
    { value: 'original', label: 'Original' },
    ...(media?.derivatives?.map((d) => ({
      value: d.id,
      label: d.displayName || `Derivative ${d.id.slice(0, 8)}`,
    })) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">{media.name}</h2>
          <div className="flex items-center gap-2">
            <Popover
              open={addToCollectionOpen}
              onOpenChange={setAddToCollectionOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="icon"
                      disabled={updateCollectionsMutation.isPending}
                    >
                      <BookmarkIcon
                        className={cn(
                          media.collections.length > 0
                            ? 'fill-destructive stroke-destructive'
                            : ''
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Edit Collections</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-[300px] p-0" align="end">
                <AddToCollectionCombobox
                  client={client}
                  asset={media}
                  onApply={(collectionIds) => {
                    updateCollectionsMutation.mutate(collectionIds);
                  }}
                  onClose={() => setAddToCollectionOpen(false)}
                />
              </PopoverContent>
            </Popover>
            {canUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="icon"
                    onClick={() => setRenameDialogOpen(true)}
                  >
                    <EditIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rename</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="icon"
                  onClick={handleDownload}
                  disabled={
                    !selectedVariant?.url || selectedVariant.status !== 'READY'
                  }
                >
                  <Download />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Popover
              open={generateVariantOpen}
              onOpenChange={setGenerateVariantOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="icon"
                      disabled={
                        !selectedVariant?.id ||
                        selectedVariant.status !== 'READY' ||
                        generateVariantMutation.isPending
                      }
                    >
                      <Sparkles />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Generate Variant</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-[300px] p-0" align="end">
                <SelectTransformTemplate
                  client={client}
                  selectedVariantMimeType={selectedVariant?.mimeType ?? ''}
                  onSelect={(templateId) => {
                    generateVariantMutation.mutate(templateId);
                  }}
                  onClose={() => setGenerateVariantOpen(false)}
                />
              </PopoverContent>
            </Popover>
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="icon"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">ID:</span>
            <div className="relative flex items-center gap-2">
              <span className="font-mono select-all">{media.id}</span>
            </div>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">Created:</span>
            <span>{new Date(media.createdAt).toLocaleString()}</span>
          </div>
          {hasDerivatives && (
            <>
              <span>•</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {media.derivatives.length + 1} variants
                </span>
              </div>
            </>
          )}
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">Total Size:</span>
            <span>{formatBytes(media.totalSize)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Preview Section */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent>
              {selectedVariant?.url && selectedVariant.status === 'READY' ? (
                <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                  {isVideo ? (
                    <video
                      src={selectedVariant.url}
                      controls
                      className="w-full h-auto max-h-[600px]"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={selectedVariant.url}
                      alt={media.name}
                      className="w-full h-auto max-h-[600px] object-contain mx-auto"
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    {isVideo ? (
                      <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {selectedVariant?.status === 'PROCESSING'
                        ? 'Processing...'
                        : selectedVariant?.status === 'FAILED'
                        ? 'Failed to load'
                        : 'No preview available'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent>
              {(hasDerivatives || selectedVariantId !== 'original') && (
                <div className="mb-6">
                  <Field>
                    <FieldLabel>Variant</FieldLabel>
                    <Select
                      value={selectedVariantId}
                      onValueChange={setSelectedVariantId}
                    >
                      <SelectTrigger className="max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variantOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              {selectedVariant ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel>MIME Type</FieldLabel>
                    <p className="text-sm font-mono">
                      {selectedVariant.mimeType}
                    </p>
                  </Field>
                  {selectedVariant.width && selectedVariant.height && (
                    <>
                      <Field>
                        <FieldLabel>Dimensions</FieldLabel>
                        <p className="text-sm">
                          {selectedVariant.width} × {selectedVariant.height}{' '}
                          pixels
                        </p>
                      </Field>
                      {selectedVariant.aspectRatio && (
                        <Field>
                          <FieldLabel>Aspect Ratio</FieldLabel>
                          <p className="text-sm">
                            {selectedVariant.aspectRatio.toFixed(2)}
                            &nbsp;×&nbsp;1
                          </p>
                        </Field>
                      )}
                    </>
                  )}
                  {selectedVariant.size && (
                    <Field>
                      <FieldLabel>File Size</FieldLabel>
                      <p className="text-sm">
                        {formatBytes(selectedVariant.size)}
                      </p>
                    </Field>
                  )}
                  {selectedVariant.duration && (
                    <Field>
                      <FieldLabel>Duration</FieldLabel>
                      <p className="text-sm">
                        {formatDuration(selectedVariant.duration, 'compact')}
                      </p>
                    </Field>
                  )}
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Badge
                      variant={getStatusBadgeVariant(selectedVariant.status)}
                      className="w-fit!"
                    >
                      {enumToTitleCase(selectedVariant.status)}
                    </Badge>
                  </Field>
                  {selectedVariant.metadata &&
                    Object.keys(selectedVariant.metadata).length > 0 && (
                      <>
                        {Object.entries(selectedVariant.metadata).map(
                          ([key, value]) => (
                            <Field key={key}>
                              <FieldLabel className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </FieldLabel>
                              <div className="text-sm text-muted-foreground">
                                {Array.isArray(value) ? (
                                  <div className="flex flex-wrap gap-2">
                                    {value.map((item: unknown, idx: number) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {String(item)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : typeof value === 'object' &&
                                  value !== null ? (
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  <p>{String(value)}</p>
                                )}
                              </div>
                            </Field>
                          )
                        )}
                      </>
                    )}
                </FieldGroup>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No variant information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <form onSubmit={renameForm.handleSubmit(handleRename)}>
            <FieldGroup>
              <Controller
                name="name"
                control={renameForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="media-name" className="sr-only">
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="media-name"
                      placeholder="Enter media name"
                      autoComplete="off"
                    />
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
                onClick={() => setRenameDialogOpen(false)}
                disabled={renameMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  renameMutation.isPending || !renameForm.formState.isDirty
                }
                isLoading={renameMutation.isPending}
              >
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPermanentlyDelete(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the media{' '}
              <span className="font-semibold">{media.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div>
            <Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="permanently-delete"
                  checked={permanentlyDelete}
                  onCheckedChange={(checked) =>
                    setPermanentlyDelete(checked === true)
                  }
                />
                <FieldLabel
                  htmlFor="permanently-delete"
                  className="font-normal cursor-pointer"
                >
                  Permanently delete
                </FieldLabel>
              </div>
            </Field>
          </div>
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
