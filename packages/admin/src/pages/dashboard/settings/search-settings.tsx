import { CreateSearchIndexDialog } from '@/components/create-search-index-dialog';
import { DeleteSearchIndexDialog } from '@/components/delete-search-index-dialog';
import { useClient } from '@/hooks/common';
import { components } from '@longpoint/sdk';
import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import { Progress } from '@longpoint/ui/components/progress';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { Spinner } from '@longpoint/ui/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function SearchSettings() {
  const client = useClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<{
    id: string;
    name: string;
    isActive: boolean;
  } | null>(null);

  const {
    data: providers,
    isLoading: providersLoading,
    error: providersError,
  } = useQuery({
    queryKey: ['vector-providers'],
    queryFn: () => client.search.listVectorProviders(),
  });

  const {
    data: indexes,
    isLoading: indexesLoading,
    error: indexesError,
  } = useQuery({
    queryKey: ['search-indexes'],
    queryFn: () => client.search.listSearchIndexes(),
  });

  const {
    data: systemStatus,
    isLoading: systemStatusLoading,
    error: systemStatusError,
  } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => client.system.getSystemStatus(),
  });

  const activeIndex = indexes?.find((index) => index.active === true);
  const totalContainers = systemStatus?.totalAssets ?? 0;
  const indexedAssets = activeIndex?.assetsIndexed ?? 0;
  const progressPercentage =
    totalContainers > 0 ? (indexedAssets / totalContainers) * 100 : 0;

  const handleDeleteClick = (index: components['schemas']['SearchIndex']) => {
    setIndexToDelete({
      id: index.id,
      name: index.name,
      isActive: index.active,
    });
    setDeleteDialogOpen(true);
  };

  if (indexesLoading || systemStatusLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (indexesError || systemStatusError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load search settings:{' '}
            {(indexesError || systemStatusError) instanceof Error
              ? (indexesError || systemStatusError)?.message
              : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Indexes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Indexes</h3>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={!providers || providers.length === 0}
          >
            Create Index
          </Button>
        </div>
        {indexes && indexes.length > 0 ? (
          indexes.map((index) => (
            <Card key={index.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{index.name}</CardTitle>
                    {index.active && (
                      <Badge variant="default" className="mt-2">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {index.indexing && (
                      <Spinner className="h-4 w-4 text-muted-foreground" />
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(index)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Vector Provider
                    </span>
                    <span className="font-medium">
                      {index.vectorProvider.name}
                    </span>
                  </div>
                  {index.lastIndexedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Last Indexed
                      </span>
                      <span className="font-medium">
                        {new Date(index.lastIndexedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Assets Indexed
                    </span>
                    <span className="font-medium">{index.assetsIndexed}</span>
                  </div>
                </div>
                {index.active && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Indexing Progress
                      </span>
                      <span className="font-medium">
                        {`${Math.round(progressPercentage)}%`}
                      </span>
                    </div>
                    <Progress
                      value={Math.round(progressPercentage)}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                No search indexes found. Create one to enable search
                functionality.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      {providers && (
        <CreateSearchIndexDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          providers={providers}
        />
      )}

      {/* Delete Dialog */}
      {indexToDelete && (
        <DeleteSearchIndexDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setIndexToDelete(null);
            }
          }}
          indexId={indexToDelete.id}
          indexName={indexToDelete.name}
          isActive={indexToDelete.isActive}
        />
      )}
    </div>
  );
}
