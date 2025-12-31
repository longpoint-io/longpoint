import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
import { Badge } from '@longpoint/ui/components/badge';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import { Field, FieldGroup, FieldLabel } from '@longpoint/ui/components/field';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@longpoint/ui/components/table';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  HardDrive,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateStorageUnitSimpleDialog } from './create-storage-unit-simple-dialog';
import { DeleteStorageProviderConfigDialog } from './delete-storage-provider-config-dialog';
import { DeleteStorageUnitDialog } from './delete-storage-unit-dialog';
import { EditStorageProviderConfigDialog } from './edit-storage-provider-config-dialog';
import { EditStorageUnitDialog } from './edit-storage-unit-dialog';
import { StorageProviderIcon } from './storage-provider-icon';

export function StorageProviderConfigDetail() {
  const { configId } = useParams<{ configId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canCreateUnit = hasPermission(Permission.STORAGE_UNITS_CREATE);
  const canUpdateUnit = hasPermission(Permission.STORAGE_UNITS_UPDATE);
  const canDeleteUnit = hasPermission(Permission.STORAGE_UNITS_DELETE);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStorageUnit, setSelectedStorageUnit] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editUnitDialogOpen, setEditUnitDialogOpen] = useState(false);
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false);
  const [createUnitDialogOpen, setCreateUnitDialogOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['storage-provider-config', configId],
    queryFn: () => client.storage.getConfig(configId!),
    enabled: !!configId,
  });

  const {
    data: storageUnitsResponse,
    isLoading: isLoadingUnits,
    error: unitsError,
  } = useQuery({
    queryKey: ['storage-units', configId, cursor],
    queryFn: () =>
      client.storage.listStorageUnits({
        configId,
        cursor,
        // pageSize: 20,
      }),
    enabled: !!configId,
  });

  const handleEditUnit = (id: string, name: string) => {
    setSelectedStorageUnit({ id, name });
    setEditUnitDialogOpen(true);
  };

  const handleDeleteUnit = (id: string, name: string) => {
    setSelectedStorageUnit({ id, name });
    setDeleteUnitDialogOpen(true);
  };

  const handleLoadMore = () => {
    if (storageUnitsResponse?.metadata?.nextCursor) {
      setCursor(storageUnitsResponse.metadata.nextCursor);
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

  if (error || !config) {
    return (
      <div className="space-y-8">
        <Button variant="ghost" onClick={() => navigate('/settings/storage')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Storage Settings
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load storage provider config or config not found
          </p>
        </div>
      </div>
    );
  }

  const storageUnits = storageUnitsResponse?.items || [];
  const hasMore = !!storageUnitsResponse?.metadata?.nextCursor;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="flex items-start gap-2">
            <Settings className="h-6 w-6 text-muted-foreground mt-2" />
            <div>
              <h2 className="text-3xl font-bold">{config.name}</h2>
              <p className="text-muted-foreground mt-1">
                Storage provider configuration
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Summary</CardTitle>
            <CardDescription>
              Basic information about this config
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <p className="text-sm">{config.name}</p>
              </Field>
              <Field>
                <FieldLabel>Provider</FieldLabel>
                <div className="flex items-center gap-2">
                  <StorageProviderIcon image={config.provider.image} />
                  <span className="text-sm">{config.provider.name}</span>
                </div>
              </Field>
              <Field>
                <FieldLabel>Usage</FieldLabel>
                <Badge variant="secondary" className="w-fit!">
                  {config.storageUnitCount || 0} storage unit
                  {config.storageUnitCount !== 1 ? 's' : ''}
                </Badge>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
            <CardDescription>Creation and modification times</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Created</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(config.createdAt).toLocaleString()}
                  </span>
                </div>
              </Field>
              <Field>
                <FieldLabel>Last Updated</FieldLabel>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(config.updatedAt).toLocaleString()}
                  </span>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {config.config && Object.keys(config.config).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuration Details</CardTitle>
                <CardDescription>
                  Provider-specific configuration values
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfigDetails(!showConfigDetails)}
              >
                {showConfigDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showConfigDetails && (
            <CardContent>
              <FieldGroup>
                {Object.entries(config.config).map(([key, value]) => (
                  <Field key={key}>
                    <FieldLabel>{key}</FieldLabel>
                    <p className="text-sm font-mono text-muted-foreground">
                      {typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </p>
                  </Field>
                ))}
              </FieldGroup>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Units</CardTitle>
              <CardDescription>
                Storage units using this configuration
              </CardDescription>
            </div>
            {canCreateUnit && (
              <Button onClick={() => setCreateUnitDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Unit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUnits ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : unitsError ? (
            <p className="text-destructive text-sm">
              Failed to load storage units:{' '}
              {unitsError instanceof Error
                ? unitsError.message
                : 'Unknown error'}
            </p>
          ) : storageUnits.length === 0 ? (
            <div className="py-8">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HardDrive className="h-12 w-12" />
                  </EmptyMedia>
                  <EmptyTitle>No storage units</EmptyTitle>
                  <EmptyDescription>
                    No storage units are using this configuration yet.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storageUnits.map((unit: any) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {unit.provider?.image ? (
                            <img
                              src={unit.provider.image}
                              alt={unit.provider.name}
                              className="h-4 w-4 rounded"
                            />
                          ) : (
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{unit.provider?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {unit.isDefault ? (
                          <Badge variant="secondary">Default</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(unit.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(canUpdateUnit || canDeleteUnit) && (
                          <div className="flex justify-end gap-2">
                            {canUpdateUnit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditUnit(unit.id, unit.name)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteUnit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteUnit(unit.id, unit.name)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingUnits}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EditStorageProviderConfigDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        configId={config.id}
        configName={config.name}
      />

      <DeleteStorageProviderConfigDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        configId={config.id}
        configName={config.name}
        usageCount={config.storageUnitCount || 0}
      />

      <CreateStorageUnitSimpleDialog
        open={createUnitDialogOpen}
        onOpenChange={(open) => {
          setCreateUnitDialogOpen(open);
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: ['storage-units', configId],
            });
          }
        }}
        configId={configId!}
      />

      {selectedStorageUnit && (
        <>
          <EditStorageUnitDialog
            open={editUnitDialogOpen}
            onOpenChange={(open) => {
              setEditUnitDialogOpen(open);
              if (!open) {
                setSelectedStorageUnit(null);
                queryClient.invalidateQueries({
                  queryKey: ['storage-units', configId],
                });
              }
            }}
            storageUnitId={selectedStorageUnit.id}
            storageUnitName={selectedStorageUnit.name}
          />
          <DeleteStorageUnitDialog
            open={deleteUnitDialogOpen}
            onOpenChange={(open) => {
              setDeleteUnitDialogOpen(open);
              if (!open) {
                setSelectedStorageUnit(null);
                queryClient.invalidateQueries({
                  queryKey: ['storage-units', configId],
                });
              }
            }}
            storageUnitId={selectedStorageUnit.id}
            storageUnitName={selectedStorageUnit.name}
          />
        </>
      )}
    </div>
  );
}
