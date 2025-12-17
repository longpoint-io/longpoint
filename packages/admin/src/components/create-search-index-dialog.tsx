import {
  ConfigSchemaForm,
  getDefaultValueForType,
  validateConfigSchemaForm,
} from '@/components/config-schema';
import { useClient } from '@/hooks/common';
import { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@longpoint/ui/components/dialog';
import { Input } from '@longpoint/ui/components/input';
import { Label } from '@longpoint/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CreateSearchIndexDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: components['schemas']['SearchProvider'][];
}

interface CreateSearchIndexFormData {
  name: string;
  searchProviderId: string;
  active: boolean;
  config: Record<string, any>;
}

export function CreateSearchIndexDialog({
  open,
  onOpenChange,
  providers,
}: CreateSearchIndexDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId);
  }, [providers, selectedProviderId]);

  const indexConfigSchema = selectedProvider?.indexConfigSchema;
  const hasIndexConfigSchema =
    indexConfigSchema && Object.keys(indexConfigSchema).length > 0;

  const defaultConfigValues = useMemo(() => {
    if (!indexConfigSchema) return {};
    const configValues: Record<string, any> = {};
    Object.entries(indexConfigSchema).forEach(([key, value]: [string, any]) => {
      configValues[key] = getDefaultValueForType(value);
    });
    return configValues;
  }, [indexConfigSchema]);

  const form = useForm<CreateSearchIndexFormData>({
    defaultValues: {
      name: '',
      searchProviderId: '',
      active: false,
      config: {},
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        searchProviderId: '',
        active: false,
        config: {},
      });
      setSelectedProviderId('');
    }
  }, [open, form]);

  // Update config defaults when provider changes
  useEffect(() => {
    if (selectedProviderId && indexConfigSchema) {
      form.setValue('config', defaultConfigValues);
    } else {
      form.setValue('config', {});
    }
  }, [selectedProviderId, indexConfigSchema, defaultConfigValues, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateSearchIndexFormData) => {
      return client.search.createSearchIndex({
        name: data.name,
        searchProviderId: data.searchProviderId,
        active: data.active,
        config: hasIndexConfigSchema
          ? (data.config as Record<string, never>)
          : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Search index created successfully');
      queryClient.invalidateQueries({ queryKey: ['search-indexes'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to create search index', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!data.searchProviderId) {
      form.setError('searchProviderId', {
        type: 'required',
        message: 'Provider is required',
      });
      return;
    }

    if (hasIndexConfigSchema) {
      const isValid = validateConfigSchemaForm(
        indexConfigSchema as any,
        data.config,
        'config',
        form.setError
      );
      if (!isValid) {
        return;
      }
    }

    createMutation.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Search Index</DialogTitle>
        </DialogHeader>
        <form id="create-search-index-form" onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="index-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="index-name"
                {...form.register('name', {
                  required: 'Name is required',
                })}
                placeholder="Main"
                aria-invalid={form.formState.errors.name ? 'true' : 'false'}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Provider Select */}
            <div className="space-y-2">
              <Label htmlFor="search-provider">
                Search Provider <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="searchProviderId"
                control={form.control}
                rules={{ required: 'Provider is required' }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedProviderId(value);
                    }}
                  >
                    <SelectTrigger
                      id="search-provider"
                      className="w-full"
                      aria-invalid={
                        form.formState.errors.searchProviderId
                          ? 'true'
                          : 'false'
                      }
                    >
                      <SelectValue placeholder="Select a search provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            {provider.image && (
                              <img
                                src={provider.image}
                                alt={provider.name}
                                className="h-4 w-4 rounded"
                              />
                            )}
                            <span>{provider.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.searchProviderId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.searchProviderId.message}
                </p>
              )}
            </div>

            {/* Index Config Form */}
            {selectedProvider && hasIndexConfigSchema && (
              <div className="space-y-4 border-t pt-6">
                {/* <div>
                  <h3 className="text-sm font-semibold">Index Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure settings specific to this index for{' '}
                    {selectedProvider.name}.
                  </p>
                </div> */}
                <ConfigSchemaForm
                  schema={indexConfigSchema as any}
                  control={form.control}
                  namePrefix="config"
                  setError={form.setError}
                  allowImmutableFields={true}
                />
              </div>
            )}

            {selectedProvider && !hasIndexConfigSchema && (
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground">
                  This provider does not require index configuration.
                </p>
              </div>
            )}

            {/* Active Checkbox */}
            <div className="flex items-center space-x-2 border-t pt-6">
              <Controller
                name="active"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="active-index"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="active-index"
                className="text-sm font-normal cursor-pointer"
              >
                Make this the active search index
              </Label>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-search-index-form"
            isLoading={createMutation.isPending}
            disabled={createMutation.isPending}
          >
            Create Index
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
