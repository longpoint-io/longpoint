import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import { Field, FieldLabel } from '@longpoint/ui/components/field';
import { useState } from 'react';

type DeleteAssetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: components['schemas']['Asset'];
  onDelete: (permanently: boolean) => void;
  isPending: boolean;
};

export function DeleteAssetDialog({
  open,
  onOpenChange,
  asset,
  onDelete,
  isPending,
}: DeleteAssetDialogProps) {
  const [permanentlyDelete, setPermanentlyDelete] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setPermanentlyDelete(false);
    }
  };

  const handleDelete = () => {
    onDelete(permanentlyDelete);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Media</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the media{' '}
            <span className="font-semibold">{asset.name}</span>?
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
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            isLoading={isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
