import { useAuth } from '@/auth';
import { PermissionsSelector } from '@/components/permissions-selector';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_ROLES, Permission } from '@longpoint/types';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@longpoint/ui/components/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@longpoint/ui/components/empty';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@longpoint/ui/components/table';
import { Textarea } from '@longpoint/ui/components/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MoreVertical,
  PencilIcon,
  Plus,
  ShieldIcon,
  TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

const updateRoleSchema = createRoleSchema.partial().extend({
  permissions: z.array(z.string()).optional(),
});

type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;

export function Roles() {
  const client = useClient();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(Permission.ROLES_CREATE);
  const canUpdate = hasPermission(Permission.ROLES_UPDATE);
  const canDelete = hasPermission(Permission.ROLES_DELETE);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
  } | null>(null);

  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.users.listRoles(),
  });

  const createForm = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const editForm = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleFormData) =>
      client.users.createRole({
        name: data.name,
        description: data.description || undefined,
        permissions: data.permissions as Permission[],
      }),
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      createForm.reset();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create role', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoleFormData) => {
      if (!selectedRole) throw new Error('No role selected');
      return client.users.updateRole(selectedRole.id, {
        name: data.name,
        description: data.description,
        permissions: data.permissions as Permission[] | undefined,
      });
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      editForm.reset();
      setEditDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      toast.error('Failed to update role', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) throw new Error('No role selected');
      return client.users.deleteRole(selectedRole.id);
    },
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to delete role', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleEdit = async (role: { id: string; name: string }) => {
    try {
      const details = await client.users.getRole(role.id);
      setSelectedRole({
        id: details.id,
        name: details.name,
        description: details.description || null,
        permissions: details.permissions || [],
      });
      editForm.reset({
        name: details.name,
        description: details.description || '',
        permissions: details.permissions || [],
      });
      setEditDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load role details', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  };

  const handleDelete = (role: { id: string; name: string }) => {
    setSelectedRole({
      id: role.id,
      name: role.name,
      description: null,
      permissions: [],
    });
    setDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (data: CreateRoleFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: UpdateRoleFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {canCreate && (
          <div className="flex items-center justify-end">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {canCreate && (
          <div className="flex items-center justify-end">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>
        )}
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load roles</p>
        </div>
      </div>
    );
  }

  const rolesList = roles || [];
  const isEmpty = rolesList.length === 0;
  const hasAnyActions = canUpdate || canDelete;

  return (
    <div className="space-y-8">
      {canCreate && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>
      )}

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No roles created yet</EmptyTitle>
            </EmptyHeader>
            {canCreate && (
              <EmptyContent>
                <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                  <Plus className="h-5 w-5" />
                  Create Role
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                {hasAnyActions && (
                  <TableHead className="w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesList.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description || '-'}
                  </TableCell>
                  {hasAnyActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              role.name === DEFAULT_ROLES.superAdmin.name
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleEdit({ id: role.id, name: role.name })
                              }
                            >
                              <PencilIcon />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDelete({ id: role.id, name: role.name })
                              }
                              variant="destructive"
                            >
                              <TrashIcon />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-role-name" required>
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="create-role-name"
                      placeholder="Enter role name"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-role-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="create-role-description"
                      placeholder="Enter role description (optional)"
                      rows={3}
                      className="min-h-20 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="permissions"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-role-permissions" required>
                      Permissions
                    </FieldLabel>
                    <PermissionsSelector
                      value={field.value}
                      onChange={field.onChange}
                      idPrefix="create-role"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-role-name" required>
                      Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-role-name"
                      placeholder="Enter role name"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-role-description">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="edit-role-description"
                      placeholder="Enter role description (optional)"
                      rows={3}
                      className="min-h-20 resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="permissions"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-role-permissions" required>
                      Permissions
                    </FieldLabel>
                    <PermissionsSelector
                      value={field.value || []}
                      onChange={field.onChange}
                      idPrefix="edit-role"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                isLoading={updateMutation.isPending}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role{' '}
              <span className="font-semibold">{selectedRole?.name}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
