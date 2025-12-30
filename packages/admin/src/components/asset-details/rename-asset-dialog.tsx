import { zodResolver } from '@hookform/resolvers/zod';
import type { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import {
  Dialog,
  DialogContent,
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
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

type RenameAssetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: components['schemas']['Asset'];
  onRename: (data: { name: string }) => void;
  isPending: boolean;
};

const renameFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type RenameFormData = z.infer<typeof renameFormSchema>;

export function RenameAssetDialog({
  open,
  onOpenChange,
  asset,
  onRename,
  isPending,
}: RenameAssetDialogProps) {
  const renameForm = useForm<RenameFormData>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: {
      name: asset.name,
    },
  });

  // Reset form when asset changes or dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && asset) {
      renameForm.reset({
        name: asset.name,
      });
    }
  };

  const handleSubmit = (data: RenameFormData) => {
    onRename(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form onSubmit={renameForm.handleSubmit(handleSubmit)}>
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
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !renameForm.formState.isDirty}
              isLoading={isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
