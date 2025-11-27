import {
  ConfigSchemaForm,
  validateConfigSchemaForm,
} from '@/components/config-schema';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { cn } from '@longpoint/ui/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PlugIcon } from 'lucide-react';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

export function PluginDetail() {
  const { pluginId } = useParams<{ pluginId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: plugin,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['plugin', pluginId],
    queryFn: () => client.plugins.getPlugin(pluginId!),
    enabled: !!pluginId,
  });

  const formSchema = z.object({
    settings: z.record(z.string(), z.any()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      settings: {},
    },
  });

  // Update form when plugin data loads
  useEffect(() => {
    if (plugin?.settingsValues) {
      form.reset({
        settings: plugin.settingsValues as Record<string, any>,
      });
    }
  }, [plugin?.settingsValues, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: { config: Record<string, any> }) => {
      return client.plugins.updatePluginSettings(pluginId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugin', pluginId] });
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast.success('Plugin settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update plugin settings', {
        description: error.message,
      });
    },
  });

  const handleSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (
    data
  ) => {
    if (!plugin?.hasSettings || !plugin.settingsSchema) {
      return;
    }

    // Validate settings
    const isValid = validateConfigSchemaForm(
      plugin.settingsSchema as any,
      data.settings,
      'settings',
      form.setError
    );
    if (!isValid) return;

    try {
      await updateMutation.mutateAsync({
        config: data.settings || {},
      });
    } catch (error) {
      // Error handling is done in mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !plugin) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => navigate('/plugins')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plugins
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load plugin or plugin not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          {plugin.icon ? (
            <img
              src={plugin.icon}
              alt={plugin.displayName}
              className={cn('size-10 rounded object-contain')}
            />
          ) : (
            <div className="flex items-center justify-center size-10 rounded bg-muted">
              <PlugIcon className="size-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold">{plugin.displayName}</h2>
            {plugin.description && (
              <p className="text-muted-foreground mt-2">
                {String(plugin.description)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plugin Information</CardTitle>
            <CardDescription>Details about this plugin</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Plugin ID</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {plugin.id}
                </p>
              </Field>
              <Field>
                <FieldLabel>Package Name</FieldLabel>
                <p className="text-sm font-mono text-muted-foreground">
                  {plugin.packageName}
                </p>
              </Field>
              {plugin.hasSettings && (
                <Field>
                  <FieldLabel>Settings</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    This plugin has configurable settings
                  </p>
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {plugin.hasSettings && plugin.settingsSchema && (
        <Card>
          <CardHeader>
            <CardTitle>Plugin Settings</CardTitle>
            <CardDescription>
              Configure settings for this plugin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <ConfigSchemaForm
                schema={plugin.settingsSchema as any}
                control={form.control}
                namePrefix="settings"
                setError={form.setError}
                allowImmutableFields={false}
              />
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/plugins')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending}
                  disabled={updateMutation.isPending}
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
