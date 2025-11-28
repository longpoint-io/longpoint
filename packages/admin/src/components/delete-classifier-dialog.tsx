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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DeleteClassifierDialogProps {
  classifierId: string;
  classifierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteClassifierDialog({
  classifierId,
  classifierName,
  open,
  onOpenChange,
}: DeleteClassifierDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => client.analysis.deleteClassifier(classifierId),
    onSuccess: () => {
      toast.success('Classifier deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['classifiers'] });
      onOpenChange(false);
      navigate('/classifiers');
    },
    onError: (error) => {
      toast.error('Failed to delete classifier', {
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
          <DialogTitle>Delete Classifier</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the classifier{' '}
            <span className="font-semibold">{classifierName}</span>? This action
            cannot be undone.
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
