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
import { toast } from 'sonner';

type DeleteVariantsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantIds: string[];
  assetId: string;
};

export function DeleteVariantsDialog({
  open,
  onOpenChange,
  variantIds,
  assetId,
}: DeleteVariantsDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      client.assets.deleteVariants({
        variantIds: ids,
      }),
    onSuccess: () => {
      toast.success(
        variantIds.length === 1
          ? 'Variant deleted successfully'
          : 'Variants deleted successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to delete variants', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(variantIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {variantIds.length === 1 ? 'Variant' : 'Variants'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            {variantIds.length === 1 ? (
              'this variant'
            ) : (
              <span className="font-semibold">
                {variantIds.length} variants
              </span>
            )}
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  );
}
