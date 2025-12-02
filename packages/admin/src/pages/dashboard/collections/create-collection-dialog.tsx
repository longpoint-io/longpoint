import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { Textarea } from '@longpoint/ui/components/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collectionId: string) => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      client.collections.createCollection({
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: (collection) => {
      toast.success('Collection created successfully');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      form.reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(collection.id);
      }
    },
    onError: (error) => {
      toast.error('Failed to create collection', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your media containers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="collection-name" required>
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="collection-name"
                    placeholder="Enter collection name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="collection-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="collection-description"
                    placeholder="Enter collection description (optional)"
                    rows={4}
                    className="min-h-24 resize-none"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Optional description for this collection
                  </FieldDescription>
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
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              isLoading={mutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
