import { useAuth } from '@/auth';
import {
  AssetDetailsHeader,
  AssetDetailsPanel,
  AssetPreview,
  DeleteAssetDialog,
  RenameAssetDialog,
  useAssetDetailsStore,
  VariantsTab,
  type AssetDetailsStore,
} from '@/components/asset-details';
import { useClient } from '@/hooks/common';
import { Permission } from '@longpoint/types';
import { Card, CardContent, CardHeader } from '@longpoint/ui/components/card';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@longpoint/ui/components/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission(Permission.ASSETS_UPDATE);
  const canDelete = hasPermission(Permission.ASSETS_DELETE);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);
  const [generateVariantOpen, setGenerateVariantOpen] = useState(false);

  const { resetSelectedVariant } = useAssetDetailsStore();

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assets', id],
    queryFn: () => client.assets.getAsset(id!),
    enabled: !!id,
  });

  // Reset selected variant when media changes
  useEffect(() => {
    if (media) {
      resetSelectedVariant();
    }
  }, [media, resetSelectedVariant]);

  // Get the currently selected variant
  const selectedVariantId = useAssetDetailsStore(
    (state: AssetDetailsStore) => state.selectedVariantId
  );
  const selectedVariant =
    selectedVariantId === 'original'
      ? media?.original
      : media?.derivatives?.find((d) => d.id === selectedVariantId) ||
        media?.thumbnails?.find((t) => t.id === selectedVariantId);

  const deleteMutation = useMutation({
    mutationFn: (permanently: boolean) =>
      client.assets.deleteAsset(id!, { permanently }),
    onSuccess: () => {
      toast.success('Asset deleted');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setDeleteDialogOpen(false);
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
    mutationFn: (data: { name: string }) =>
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
      return client.transformers.generateVariantFromTemplate(templateId, {
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

  const handleRename = (data: { name: string }) => {
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

  const handleDelete = (permanently: boolean) => {
    deleteMutation.mutate(permanently);
  };

  const isVideo = media?.type === 'VIDEO';
  const hasDerivatives = Boolean(
    media?.derivatives && media.derivatives.length > 0
  );

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

  return (
    <div className="space-y-6">
      <AssetDetailsHeader
        asset={media}
        canUpdate={canUpdate}
        canDelete={canDelete}
        selectedVariant={selectedVariant}
        onRename={() => setRenameDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
        onDownload={handleDownload}
        onAddToCollection={(collectionIds) => {
          updateCollectionsMutation.mutate(collectionIds);
        }}
        onGenerateVariant={(templateId) => {
          generateVariantMutation.mutate(templateId);
        }}
        client={client}
        addToCollectionOpen={addToCollectionOpen}
        setAddToCollectionOpen={setAddToCollectionOpen}
        generateVariantOpen={generateVariantOpen}
        setGenerateVariantOpen={setGenerateVariantOpen}
        updateCollectionsMutationPending={updateCollectionsMutation.isPending}
        generateVariantMutationPending={generateVariantMutation.isPending}
      />

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <AssetPreview asset={media} isVideo={isVideo} />
            <AssetDetailsPanel asset={media} hasDerivatives={hasDerivatives} />
          </div>
        </TabsContent>
        <TabsContent value="variants" className="mt-3">
          <VariantsTab asset={media} />
        </TabsContent>
      </Tabs>
      <div className="mt-16" />

      <RenameAssetDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        asset={media}
        onRename={handleRename}
        isPending={renameMutation.isPending}
      />

      <DeleteAssetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        asset={media}
        onDelete={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
