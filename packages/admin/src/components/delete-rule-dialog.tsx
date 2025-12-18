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

interface DeleteRuleDialogProps {
  ruleId: string;
  ruleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRuleDialog({
  ruleId,
  ruleName,
  open,
  onOpenChange,
}: DeleteRuleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const client = useClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => client.rules.deleteRule(ruleId),
    onSuccess: () => {
      toast.success('Rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      onOpenChange(false);
      navigate('/rules');
    },
    onError: (error) => {
      toast.error('Failed to delete rule', {
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
          <DialogTitle>Delete Rule</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the rule{' '}
            <span className="font-semibold">{ruleName}</span>? This action
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



