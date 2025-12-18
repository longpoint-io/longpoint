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

interface DeleteTransformerTemplateDialogProps {
  templateId: string;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTransformerTemplateDialog({
  templateId,
  templateName,
  open,
  onOpenChange,
}: DeleteTransformerTemplateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => client.transformers.deleteTransformerTemplate(templateId),
    onSuccess: () => {
      toast.success('Transformer template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['transformer-templates'] });
      onOpenChange(false);
      navigate('/transformer/templates');
    },
    onError: (error) => {
      toast.error('Failed to delete transformer template', {
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
          <DialogTitle>Delete Transformer Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the transformer template{' '}
            <span className="font-semibold">{templateName}</span>? This action
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
