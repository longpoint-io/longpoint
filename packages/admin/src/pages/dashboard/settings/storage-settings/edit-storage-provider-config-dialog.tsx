import { ConfigSchemaForm } from '@/components/config-schema';
import { useClient } from '@/hooks/common/use-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@longpoint/ui/components/alert-dialog';
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  config: z.record(z.string(), z.any()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditStorageProviderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: string;
  configName: string;
}

export function EditStorageProviderConfigDialog({
  open,
  onOpenChange,
  configId,
  configName,
}: EditStorageProviderConfigDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();
  const [showWarning, setShowWarning] = React.useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['storage-provider-config', configId],
    queryFn: () => client.storage.getConfig(configId),
    enabled: open && !!configId,
  });

  const { data: providers } = useQuery({
    queryKey: ['storage-providers'],
    queryFn: () => client.storage.listProviders(),
  });

  const selectedProvider = providers?.find(
    (p) => p.id === config?.provider?.id
  );
  const configSchema = selectedProvider?.configSchema || {};

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      config: {},
    },
  });

  // Initialize form when config loads
  React.useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        config: config.config || {},
      });
    }
  }, [config, form]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && config) {
      form.reset({
        name: config.name,
        config: config.config || {},
      });
      setShowWarning(false);
    }
  }, [open, config, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return client.storage.updateConfig(configId, {
        name: data.name,
        config: data.config as any,
      });
    },
    onSuccess: () => {
      toast.success('Storage provider config updated successfully');
      queryClient.invalidateQueries({ queryKey: ['storage-provider-configs'] });
      queryClient.invalidateQueries({
        queryKey: ['storage-provider-config', configId],
      });
      queryClient.invalidateQueries({ queryKey: ['storage-units'] });
      setShowWarning(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update storage provider config', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (config && config.storageUnitCount && config.storageUnitCount > 0) {
      setShowWarning(true);
    } else {
      updateMutation.mutate(data);
    }
  });

  const handleConfirmUpdate = () => {
    const data = form.getValues();
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Provider Config</DialogTitle>
          </DialogHeader>
          <div className="py-4">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Storage Provider Config</DialogTitle>
            <DialogDescription>
              Update the storage provider configuration. Changes will affect all
              storage units using this config.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="config-name">Name</FieldLabel>
                    <Input {...field} id="config-name" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {Object.keys(configSchema).length > 0 && (
                <ConfigSchemaForm
                  schema={configSchema as any}
                  control={form.control}
                  namePrefix="config"
                  setError={form.setError}
                  allowImmutableFields={false}
                />
              )}
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

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Shared Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              This configuration is currently used by {config.storageUnitCount}{' '}
              storage unit{config.storageUnitCount !== 1 ? 's' : ''}. Updating
              it will affect all of them. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpdate}>
              Update Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
