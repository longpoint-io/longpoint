import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import { Checkbox } from '@longpoint/ui/components/checkbox';
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
import { MoreVertical, TrashIcon, UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const updateUserSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  roleIds: z.array(z.string()).optional(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export function Users() {
  const client = useClient();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
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
      const response = await client.users.listUsers({ pageSize: 100 });
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
      return client.users.updateUser(selectedUser.id, {
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
      return client.users.deleteUser(selectedUser.id);
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
      const user = await client.users.getUser(userId);
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

  const handleView = async (userId: string) => {
    try {
      const user = await client.users.getUser(userId);
      setSelectedUser({
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles || [],
        createdAt: user.createdAt,
      });
      setViewDialogOpen(true);
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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Users</h2>
            <p className="text-muted-foreground mt-2">
              Manage users and their roles
            </p>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Users</h2>
            <p className="text-muted-foreground mt-2">
              Manage users and their roles
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load users</p>
        </div>
      </div>
    );
  }

  const users = usersResponse?.items || [];
  const isEmpty = users.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Users</h2>
          <p className="text-muted-foreground mt-2">
            Manage users and their roles
          </p>
        </div>
      </div>

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
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.map((r) => r.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? format(new Date(user.createdAt), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(user.id)}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete({ id: user.id, name: user.name })
                          }
                          className="text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and roles
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Name</FieldLabel>
                <p className="text-sm mt-1">{selectedUser.name}</p>
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <p className="text-sm mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <FieldLabel>Roles</FieldLabel>
                <p className="text-sm mt-1">
                  {selectedUser.roles.length > 0
                    ? selectedUser.roles.map((r) => r.name).join(', ')
                    : 'No roles assigned'}
                </p>
              </div>
              <div>
                <FieldLabel>Created At</FieldLabel>
                <p className="text-sm mt-1">
                  {format(new Date(selectedUser.createdAt), 'PPpp')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user email and roles</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={editForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
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
                    <FieldLabel htmlFor="edit-user-roles">Roles</FieldLabel>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                      {roles?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No roles available
                        </p>
                      ) : (
                        roles?.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`user-role-${role.id}`}
                              checked={field.value?.includes(role.id) || false}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, role.id]);
                                } else {
                                  field.onChange(
                                    current.filter((id) => id !== role.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`user-role-${role.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {role.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
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
    </div>
  );
}
