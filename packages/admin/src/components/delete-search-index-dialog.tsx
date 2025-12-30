import { useClient } from '@/hooks/common/use-client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@longpoint/ui/components/alert';
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

interface DeleteSearchIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indexId: string;
  indexName: string;
  isActive: boolean;
}

export function DeleteSearchIndexDialog({
  open,
  onOpenChange,
  indexId,
  indexName,
  isActive,
}: DeleteSearchIndexDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const client = useClient();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => client.search.deleteIndex(indexId),
    onSuccess: () => {
      toast.success('Search index deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['search-indexes'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to delete search index', {
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
          <DialogTitle>Delete Search Index</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the search index{' '}
            <span className="font-semibold">{indexName}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {isActive && (
          <Alert variant="destructive">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              You are about to delete the active search index. This will make
              search functionality unavailable until a new index is created and
              indexed. All indexed data will be permanently deleted.
            </AlertDescription>
          </Alert>
        )}
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
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
