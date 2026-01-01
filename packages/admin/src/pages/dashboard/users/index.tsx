import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Permission } from '@longpoint/types';
import { Badge } from '@longpoint/ui/components/badge';
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
  EmptyDescription,
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
import { ItemPickerCombobox } from '@longpoint/ui/components/item-picker-combobox';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@longpoint/ui/components/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Copy,
  MoreVertical,
  PencilIcon,
  Plus,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { CreateRegistrationDialog } from './create-registration-dialog';

const updateUserSchema = z.object({
  email: z.email('Please enter a valid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export function Users() {
  const client = useClient();
  const { session, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = hasPermission(Permission.USERS_CREATE);
  const canUpdate = hasPermission(Permission.USERS_UPDATE);
  const canDelete = hasPermission(Permission.USERS_DELETE);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createRegistrationDialogOpen, setCreateRegistrationDialogOpen] =
    useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    roles: Array<{ id: string; name: string }>;
    createdAt: string;
  } | null>(null);

  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await client.users.list({ pageSize: 100 });
      return response;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.users.listRoles(),
  });

  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: '',
      roleIds: [],
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserFormData) => {
      if (!selectedUser) throw new Error('No user selected');
      return client.users.update(selectedUser.id, {
        email: data.email,
        roleIds: data.roleIds,
      });
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      editForm.reset();
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error('Failed to update user', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error('No user selected');
      return client.users.delete(selectedUser.id);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error('Failed to delete user', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleEdit = async (userId: string) => {
    try {
      const user = await client.users.get(userId);
      setSelectedUser({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles || [],
        createdAt: user.createdAt,
      });
      editForm.reset({
        email: user.email,
        roleIds: user.roles?.map((r) => r.id) || [],
      });
      setEditDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load user details', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  };

  const handleDelete = (user: { id: string; name: string }) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: '',
      roles: [],
      createdAt: '',
    });
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  const users = usersResponse?.items || [];
  const isEmpty = users.length === 0;
  const hasAnyActions = canUpdate || canDelete;

  return (
    <div className="space-y-8">
      {canCreate && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setCreateRegistrationDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      )}

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No users found</EmptyTitle>
              <EmptyDescription className="text-base">
                Users will appear here once they register
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Created At</TableHead>
                {hasAnyActions && (
                  <TableHead className="w-[100px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((r) => (
                      <Badge variant="secondary" key={r.id} className="mr-2">
                        {r.name}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(new Date(user.createdAt), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  {hasAnyActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => handleEdit(user.id)}
                            >
                              <PencilIcon />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && user.id !== session?.user.id && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDelete({ id: user.id, name: user.name })
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-user-email" required>
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-user-email"
                      type="email"
                      placeholder="Enter email address"
                      autoComplete="email"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="roleIds"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-user-roles" required>
                      Roles
                    </FieldLabel>
                    <ItemPickerCombobox
                      items={roles || []}
                      selectedIds={field.value}
                      onSelectionChange={field.onChange}
                      itemLabel="Role"
                      emptyMessage="No roles available"
                      searchPlaceholder="Search roles..."
                      disabled={updateMutation.isPending}
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
                disabled={
                  updateMutation.isPending || !editForm.formState.isDirty
                }
                isLoading={updateMutation.isPending}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user{' '}
              <span className="font-semibold">{selectedUser?.name}</span>? This
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

      {/* Create Registration Dialog */}
      <CreateRegistrationDialog
        open={createRegistrationDialogOpen}
        onOpenChange={setCreateRegistrationDialogOpen}
        onSuccess={(url) => {
          setRegistrationUrl(url);
          setSuccessDialogOpen(true);
        }}
      />

      {/* Success Dialog with Registration URL */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Created</DialogTitle>
            <DialogDescription>
              Share this registration link with the user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-2">
              <div className="flex-1 font-mono text-sm bg-muted border border-border rounded-md p-3 break-all select-all">
                {registrationUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(registrationUrl);
                  toast.success('Registration URL copied to clipboard');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
