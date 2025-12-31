import {
  ConfigSchemaForm,
  getDefaultValueForType,
} from '@/components/config-schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardDrive } from 'lucide-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  providerId: z.string().min(1, 'Provider is required'),
  config: z.record(z.string(), z.any()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateStorageProviderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStorageProviderConfigDialog({
  open,
  onOpenChange,
}: CreateStorageProviderConfigDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ['storage-providers'],
    queryFn: () => client.storage.listProviders(),
    enabled: open,
  });

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      providerId: undefined as any,
      config: {},
    },
  });

  const selectedProviderId = form.watch('providerId');
  const selectedProvider = providers?.find((p) => p.id === selectedProviderId);
  const configSchema = selectedProvider?.configSchema || {};

  // Set default provider when providers load
  React.useEffect(() => {
    if (providers && providers.length > 0 && !selectedProviderId) {
      form.setValue('providerId', providers[0].id);
    }
  }, [providers, selectedProviderId, form]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        providerId: undefined as any,
        config: {},
      });
    }
  }, [open, form]);

  // Initialize config defaults when provider changes
  React.useEffect(() => {
    if (configSchema) {
      const defaults: Record<string, any> = {};
      Object.entries(configSchema).forEach(([key, value]: [string, any]) => {
        defaults[key] = getDefaultValueForType(value);
      });
      form.setValue('config', defaults);
    }
  }, [selectedProviderId, configSchema, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return client.storage.createConfig({
        name: data.name,
        providerId: data.providerId,
        config: data.config as any,
      });
    },
    onSuccess: () => {
      toast.success('Storage provider config created successfully');
      queryClient.invalidateQueries({ queryKey: ['storage-provider-configs'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create storage provider config', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Storage Provider Config</DialogTitle>
          <DialogDescription>
            Create a new storage provider configuration that can be shared by
            multiple storage units.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="config-name">Name</FieldLabel>
                  <Input {...field} id="config-name" placeholder="My Config" />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="providerId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="config-provider">Provider</FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isLoadingProviders}
                  >
                    <SelectTrigger id="config-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProviders ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Loading providers...
                        </div>
                      ) : providers && providers.length > 0 ? (
                        providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              {provider.image ? (
                                <img
                                  src={provider.image}
                                  alt={provider.name}
                                  className="h-4 w-4 rounded"
                                />
                              ) : (
                                <HardDrive className="h-4 w-4" />
                              )}
                              <span>{provider.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No providers available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                  <FieldDescription>
                    Select a storage provider for this configuration.
                  </FieldDescription>
                </Field>
              )}
            />

            {Object.keys(configSchema).length > 0 && (
              <ConfigSchemaForm
                schema={configSchema as any}
                control={form.control}
                namePrefix="config"
                setError={form.setError}
                allowImmutableFields={true}
              />
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
