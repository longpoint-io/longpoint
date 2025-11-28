import { useClient } from '@/hooks/common';
import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import { CopyButton } from '@longpoint/ui/components/copy-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { formatBytes } from '@longpoint/utils/format';
import { enumToTitleCase } from '@longpoint/utils/string';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Download, ImageIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function MediaDetail() {
  const { id } = useParams<{ id: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentlyDelete, setPermanentlyDelete] = useState(false);

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['media', id],
    queryFn: () => client.media.getMedia(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      client.media.deleteMedia(id!, { permanently: permanentlyDelete }),
    onSuccess: () => {
      toast.success('Media deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['library-tree'] });
      setDeleteDialogOpen(false);
      setPermanentlyDelete(false);
      navigate('/browser');
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

  const handleDownload = async () => {
    const primaryAsset = media?.variants?.primary;
    if (primaryAsset?.url) {
      try {
        const response = await fetch(primaryAsset.url);
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

  const primaryAsset = media?.variants?.primary;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-mono mb-1">
            {media.path !== '/' ? media.path + '/' : '/'}
          </p>
          <h2 className="text-3xl font-bold">{media.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={!primaryAsset?.url || primaryAsset.status !== 'READY'}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Preview Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              {primaryAsset?.url && primaryAsset.status === 'READY' ? (
                <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                  <img
                    src={primaryAsset.url}
                    alt={media.name}
                    className="w-full h-auto max-h-[600px] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {primaryAsset?.status === 'PROCESSING'
                        ? 'Processing...'
                        : primaryAsset?.status === 'FAILED'
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
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Information</CardTitle>
              <CardDescription>Basic details about this media</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>ID</FieldLabel>
                  <div className="relative">
                    <p className="text-sm font-mono text-muted-foreground select-all pr-8">
                      {media.id}
                    </p>
                    <CopyButton
                      value={media.id}
                      iconOnly
                      className="absolute -top-1.5 left-52"
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm capitalize">
                      {media.type.toLowerCase()}
                    </p>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Badge
                    variant={getStatusBadgeVariant(media.status)}
                    className="w-fit!"
                  >
                    {enumToTitleCase(media.status)}
                  </Badge>
                </Field>
                <Field>
                  <FieldLabel>Created</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(media.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {primaryAsset && (
            <Card>
              <CardHeader>
                <CardTitle>Primary Asset</CardTitle>
                <CardDescription>
                  Information about the primary asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel>MIME Type</FieldLabel>
                    <p className="text-sm font-mono">{primaryAsset.mimeType}</p>
                  </Field>
                  {primaryAsset.width && primaryAsset.height && (
                    <>
                      <Field>
                        <FieldLabel>Dimensions</FieldLabel>
                        <p className="text-sm">
                          {primaryAsset.width} × {primaryAsset.height} pixels
                        </p>
                      </Field>
                      {primaryAsset.aspectRatio && (
                        <Field>
                          <FieldLabel>Aspect Ratio</FieldLabel>
                          <p className="text-sm">
                            {primaryAsset.aspectRatio.toFixed(2)}:1
                          </p>
                        </Field>
                      )}
                    </>
                  )}
                  {primaryAsset.size && (
                    <Field>
                      <FieldLabel>File Size</FieldLabel>
                      <p className="text-sm">
                        {formatBytes(primaryAsset.size)}
                      </p>
                    </Field>
                  )}
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Badge
                      variant={getStatusBadgeVariant(primaryAsset.status)}
                      className="w-fit!"
                    >
                      {enumToTitleCase(primaryAsset.status)}
                    </Badge>
                  </Field>
                  {primaryAsset.metadata &&
                    Object.keys(primaryAsset.metadata).length > 0 && (
                      <>
                        {Object.entries(primaryAsset.metadata).map(
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
              <span className="font-semibold">{media.name}</span>? This action
              cannot be undone.
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
