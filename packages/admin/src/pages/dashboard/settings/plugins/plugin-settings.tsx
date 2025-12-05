import { PluginCard } from '@/components/plugin-card';
import { useClient } from '@/hooks/common/use-client';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { PlugIcon } from 'lucide-react';

export function PluginSettings() {
  const client = useClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => client.plugins.listPlugins(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Installed</h3>
            <p className="text-muted-foreground mt-2">
              Manage plugin configuration
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
            <h3 className="text-2xl font-semibold">Installed</h3>
            <p className="text-muted-foreground mt-2">
              Manage plugin configuration
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load plugins</p>
        </div>
      </div>
    );
  }

  const plugins = data || [];
  const isEmpty = plugins.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Installed</h3>
          <p className="text-muted-foreground mt-2">
            Manage plugin configuration
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlugIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No plugins installed</EmptyTitle>
              <EmptyDescription className="text-base">
                Plugins will appear here once installed
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plugins.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  );
}
