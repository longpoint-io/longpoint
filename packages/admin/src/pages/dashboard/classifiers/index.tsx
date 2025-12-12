import { useAuth } from '@/auth';
import { ClassifierCard } from '@/components/classifier-card';
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
import { Brain, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Classifiers() {
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.CLASSIFIERS_CREATE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['classifier-templates'],
    queryFn: () => client.classifiers.listClassifierTemplates(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Classifiers</h2>
            <p className="text-muted-foreground mt-2">
              Automatically analyze your media
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
            <h2 className="text-3xl font-bold">Classifiers</h2>
            <p className="text-muted-foreground mt-2">
              Automatically analyze your media
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load classifiers</p>
        </div>
      </div>
    );
  }

  const classifiers = data?.items || [];
  const pluginTemplates = classifiers.filter((c) => c.source === 'plugin');
  const customTemplates = classifiers.filter((c) => c.source === 'custom');
  const isEmpty = classifiers.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Classifiers</h2>
          <p className="text-muted-foreground mt-2">
            Automatically analyze your media
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/classifier-templates/create')}>
            <Plus className="h-4 w-4" />
            Create Classifier Template
          </Button>
        )}
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Brain className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">
                No classifiers created yet
              </EmptyTitle>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button
                  onClick={() => navigate('/classifier-templates/create')}
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
                {pluginTemplates.map((classifier) => (
                  <ClassifierCard
                    key={classifier.name}
                    classifierTemplate={classifier}
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
                {customTemplates.map((classifier) => (
                  <ClassifierCard
                    key={classifier.id}
                    classifierTemplate={classifier}
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
