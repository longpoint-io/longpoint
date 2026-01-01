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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { Switch } from '@longpoint/ui/components/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  provider: z.string().optional(),
  isDefault: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditStorageUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storageUnitId: string;
  storageUnitName: string;
}

export function EditStorageUnitDialog({
  open,
  onOpenChange,
  storageUnitId,
  storageUnitName,
}: EditStorageUnitDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();

  const { data: storageUnit, isLoading } = useQuery({
    queryKey: ['storage-units', storageUnitId],
    queryFn: ({ queryKey: [, id] }) => client.storage.getStorageUnit(id),
    enabled: open && !!storageUnitId,
  });

  const { data: providers } = useQuery({
    queryKey: ['storage-providers'],
    queryFn: () => client.storage.listProviders(),
    enabled: open,
  });

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      provider: '',
      isDefault: false,
      config: {},
    },
  });

  // Reset form when storage unit data loads
  useEffect(() => {
    if (storageUnit) {
      form.reset({
        name: storageUnit.name,
        provider: storageUnit.provider.id,
        isDefault: storageUnit.isDefault,
        config: storageUnit.config || {},
      });
    }
  }, [storageUnit, form]);

  const selectedProviderId =
    form.watch('provider') || storageUnit?.provider?.id;
  const selectedProvider = providers?.find((p) => p.id === selectedProviderId);
  const configSchema = selectedProvider?.configSchema || {};

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updateData: {
        name?: string;
        isDefault?: boolean;
        config?: Record<string, any>;
      } = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.isDefault !== undefined) {
        updateData.isDefault = data.isDefault;
      }
      if (data.config !== undefined) {
        updateData.config = data.config;
      }

      return client.storage.updateStorageUnit(storageUnitId, updateData as any);
    },
    onSuccess: () => {
      toast.success('Storage unit updated successfully');
      queryClient.invalidateQueries({ queryKey: ['storage-units'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update storage unit', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Unit</DialogTitle>
            <DialogDescription>Loading...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Storage Unit</DialogTitle>
          <DialogDescription>
            Update storage unit settings for {storageUnitName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="storage-unit-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="storage-unit-name"
                    placeholder="My Storage Unit"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="isDefault"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="storage-unit-default">
                    Default Storage Unit
                  </FieldLabel>
                  <Switch
                    id="storage-unit-default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldDescription>
                    Mark this as the default storage unit for new media
                    containers.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
