import { useAuth } from '@/auth';
import { TransformerTemplateCard } from '@/components/transformer-template-card';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
import { Button } from '@longpoint/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Move3dIcon, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TransformerTemplates() {
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.TRANSFORMER_TEMPLATES_CREATE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transformer-templates'],
    queryFn: () => client.transformers.listTransformerTemplates(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Transformer Templates</h2>
            <p className="text-muted-foreground mt-2">
              Define templates for transforming assets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Transformer Templates</h2>
            <p className="text-muted-foreground mt-2">
              Define templates for transforming assets
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load transformer templates
          </p>
        </div>
      </div>
    );
  }

  const templates = data?.items || [];
  const pluginTemplates = templates.filter((t) => t.source === 'plugin');
  const customTemplates = templates.filter((t) => t.source === 'custom');
  const isEmpty = templates.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Transformer Templates</h2>
          <p className="text-muted-foreground mt-2">
            Define templates for transforming assets
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/transformer/templates/create')}>
            <Plus className="h-4 w-4" />
            Create Transformer Template
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Move3dIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">
                No transformer templates created yet
              </EmptyTitle>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button
                  onClick={() => navigate('/transformer/templates/create')}
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Create
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : (
        <div className="space-y-8">
          {pluginTemplates.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Plugin Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Templates provided by installed plugins
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pluginTemplates.map((template) => (
                  <TransformerTemplateCard
                    key={template.id}
                    template={template}
                  />
                ))}
              </div>
            </div>
          )}

          {customTemplates.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Custom Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Templates you've created
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {customTemplates.map((template) => (
                  <TransformerTemplateCard
                    key={template.id}
                    template={template}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
