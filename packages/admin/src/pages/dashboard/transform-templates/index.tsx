import { useAuth } from '@/auth';
import { TransformTemplateCard } from '@/components/transform-template-card';
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

export function TransformTemplates() {
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.TRANSFORM_TEMPLATES_CREATE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transform-templates'],
    queryFn: () => client.transform.listTransformTemplates(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Transform Templates</h2>
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
            <h2 className="text-3xl font-bold">Transform Templates</h2>
            <p className="text-muted-foreground mt-2">
              Define templates for transforming assets
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load transform templates</p>
        </div>
      </div>
    );
  }

  const templates = data?.items || [];
  const isEmpty = templates.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Transform Templates</h2>
          <p className="text-muted-foreground mt-2">
            Define templates for transforming assets
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/transform/templates/create')}>
            <Plus className="h-4 w-4" />
            Create Transform Template
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
                No transform templates created yet
              </EmptyTitle>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button
                  onClick={() => navigate('/transform/templates/create')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <TransformTemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
