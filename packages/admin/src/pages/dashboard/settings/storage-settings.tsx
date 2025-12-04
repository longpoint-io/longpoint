import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
import { Button } from '@longpoint/ui/components/button';
import { Card, CardContent, CardHeader } from '@longpoint/ui/components/card';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Plus, Settings } from 'lucide-react';
import { useState } from 'react';
import { CreateStorageProviderConfigDialog } from './storage-settings/create-storage-provider-config-dialog';
import { StorageProviderConfigCard } from './storage-settings/storage-provider-config-card';

export function StorageSettings() {
  const client = useClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(Permission.STORAGE_UNITS_CREATE);
  const [createConfigDialogOpen, setCreateConfigDialogOpen] = useState(false);

  const {
    data: configs,
    isLoading: isLoadingConfigs,
    error: configsError,
  } = useQuery({
    queryKey: ['storage-provider-configs'],
    queryFn: () => client.storage.listStorageConfigs(),
  });

  const configsList = configs || [];
  const configsEmpty = configsList.length === 0;

  return (
    <div className="space-y-8">
      {/* Storage Provider Configs Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Configurations</h3>
            <p className="text-muted-foreground mt-1">
              Manage storage provider connections
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateConfigDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Config
            </Button>
          )}
        </div>

        {isLoadingConfigs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : configsError ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load storage provider configs:{' '}
                {configsError instanceof Error
                  ? configsError.message
                  : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        ) : configsEmpty ? (
          <div className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Settings className="h-12 w-12" />
                </EmptyMedia>
                <EmptyTitle className="text-2xl">
                  No storage settings created yet
                </EmptyTitle>
              </EmptyHeader>
              {canCreate && (
                <EmptyContent>
                  <Button
                    onClick={() => setCreateConfigDialogOpen(true)}
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Config
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {configsList.map((config) => (
              <StorageProviderConfigCard key={config.id} config={config} />
            ))}
          </div>
        )}
      </div>

      <CreateStorageProviderConfigDialog
        open={createConfigDialogOpen}
        onOpenChange={setCreateConfigDialogOpen}
      />
    </div>
  );
}
