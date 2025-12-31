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
import { Switch } from '@longpoint/ui/components/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HardDrive } from 'lucide-react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  storageProviderConfigId: z.string().optional(),
  newConfigName: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
  isDefault: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateStorageUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStorageUnitDialog({
  open,
  onOpenChange,
}: CreateStorageUnitDialogProps) {
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
      provider: undefined as any,
      storageProviderConfigId: undefined,
      newConfigName: '',
      isDefault: false,
      config: {},
    },
  });

  const selectedProviderId = form.watch('provider');
  const storageProviderConfigId = form.watch('storageProviderConfigId');
  const selectedProvider = providers?.find((p) => p.id === selectedProviderId);
  const configSchema = selectedProvider?.configSchema || {};
  const hasConfigSchema = Object.keys(configSchema).length > 0;
  const isCreatingNewConfig = storageProviderConfigId === '__create_new__';

  // Fetch existing configs for the selected provider
  const { data: existingConfigs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['storage-provider-configs', selectedProviderId],
    queryFn: () =>
      selectedProviderId
        ? client.storage.listConfigs({
            providerId: selectedProviderId,
          })
        : Promise.resolve([]),
    enabled: open && !!selectedProviderId && hasConfigSchema,
  });

  // Set default provider when providers load
  React.useEffect(() => {
    if (providers && providers.length > 0 && !selectedProviderId) {
      form.setValue('provider', providers[0].id);
    }
  }, [providers, selectedProviderId, form]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        provider: undefined as any,
        storageProviderConfigId: undefined,
        newConfigName: '',
        isDefault: false,
        config: {},
      });
    }
  }, [open, form]);

  // Initialize config defaults when creating new config
  React.useEffect(() => {
    if (isCreatingNewConfig && hasConfigSchema) {
      const defaults: Record<string, any> = {};
      Object.entries(configSchema).forEach(([key, value]: [string, any]) => {
        defaults[key] = getDefaultValueForType(value);
      });
      form.setValue('config', defaults);
    }
  }, [isCreatingNewConfig, configSchema, hasConfigSchema, form]);

  // Reset config selection when provider changes
  React.useEffect(() => {
    if (selectedProviderId) {
      form.setValue('storageProviderConfigId', undefined);
      form.setValue('newConfigName', '');
      form.setValue('config', {});
    }
  }, [selectedProviderId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (
        data.storageProviderConfigId &&
        data.storageProviderConfigId !== '__create_new__'
      ) {
        return client.storage.createStorageUnit({
          name: data.name,
          storageConfigId: data.storageProviderConfigId,
          isDefault: data.isDefault ?? false,
        });
      } else {
        const config = await client.storage.createConfig({
          name: data.newConfigName || `${data.name} Config`,
          providerId: data.provider,
          config: data.config as any,
        });
        return client.storage.createStorageUnit({
          name: data.name,
          storageConfigId: config.id,
          isDefault: data.isDefault ?? false,
        });
      }
    },
    onSuccess: () => {
      toast.success('Storage unit created successfully');
      queryClient.invalidateQueries({ queryKey: ['storage-units'] });
      queryClient.invalidateQueries({ queryKey: ['storage-provider-configs'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create storage unit', {
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
          <DialogTitle>Create Storage Unit</DialogTitle>
          <DialogDescription>
            Create a new storage unit to store your media containers.
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
              name="provider"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="storage-unit-provider">
                    Provider
                  </FieldLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isLoadingProviders}
                  >
                    <SelectTrigger id="storage-unit-provider">
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
                    Select a storage provider for this storage unit.
                  </FieldDescription>
                </Field>
              )}
            />

            {selectedProviderId && hasConfigSchema && (
              <Controller
                name="storageProviderConfigId"
                control={form.control}
                rules={{ required: 'Please select a configuration' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="storage-provider-config">
                      Configuration
                    </FieldLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isLoadingConfigs}
                    >
                      <SelectTrigger id="storage-provider-config">
                        <SelectValue placeholder="Select configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingConfigs ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading configurations...
                          </div>
                        ) : (
                          <>
                            <SelectItem value="__create_new__">
                              Create new configuration
                            </SelectItem>
                            {existingConfigs && existingConfigs.length > 0 && (
                              <>
                                {existingConfigs.map((config) => (
                                  <SelectItem key={config.id} value={config.id}>
                                    {config.name}
                                    {config.storageUnitCount !== undefined &&
                                      config.storageUnitCount > 0 && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({config.storageUnitCount} unit
                                          {config.storageUnitCount !== 1
                                            ? 's'
                                            : ''}
                                          )
                                        </span>
                                      )}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                    <FieldDescription>
                      Select an existing configuration or create a new one.
                    </FieldDescription>
                  </Field>
                )}
              />
            )}

            {isCreatingNewConfig && hasConfigSchema && (
              <div className="space-y-4">
                <Controller
                  name="newConfigName"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="new-config-name">
                        Configuration Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="new-config-name"
                        placeholder="My Config"
                      />
                      <FieldDescription>
                        Optional. If not provided, will use "
                        {form.watch('name')} Config"
                      </FieldDescription>
                    </Field>
                  )}
                />
                <ConfigSchemaForm
                  schema={configSchema as any}
                  control={form.control}
                  namePrefix="config"
                  setError={form.setError}
                  allowImmutableFields={true}
                />
              </div>
            )}

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
