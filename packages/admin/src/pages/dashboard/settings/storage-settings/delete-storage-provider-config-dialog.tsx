import { useClient } from '@/hooks/common/use-client';
import { Button } from '@longpoint/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeleteStorageProviderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: string;
  configName: string;
  usageCount: number;
}

export function DeleteStorageProviderConfigDialog({
  open,
  onOpenChange,
  configId,
  configName,
  usageCount,
}: DeleteStorageProviderConfigDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const client = useClient();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => client.storage.deleteConfig(configId),
    onSuccess: () => {
      toast.success('Storage provider config deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['storage-provider-configs'] });
      queryClient.invalidateQueries({ queryKey: ['storage-units'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to delete storage provider config', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    deleteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Storage Provider Config</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the storage provider config{' '}
            <span className="font-semibold">{configName}</span>? This action
            cannot be undone.
            {usageCount > 0 && (
              <span className="block mt-2 text-destructive">
                Warning: This config is currently used by {usageCount} storage
                unit{usageCount !== 1 ? 's' : ''} and cannot be deleted.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || usageCount > 0}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
