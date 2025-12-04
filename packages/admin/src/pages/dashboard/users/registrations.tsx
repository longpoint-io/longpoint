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
  EmptyContent,
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
import { format, isAfter } from 'date-fns';
import {
  CopyIcon,
  MailIcon,
  MoreVertical,
  Plus,
  TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const createRegistrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

type CreateRegistrationFormData = z.infer<typeof createRegistrationSchema>;

export function Registrations() {
  const client = useClient();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState<string>('');
  const [selectedRegistration, setSelectedRegistration] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const {
    data: registrations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-registrations'],
    queryFn: () => client.users.listUserRegistrations(),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.users.listRoles(),
  });

  const createForm = useForm<CreateRegistrationFormData>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: {
      email: '',
      roleIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRegistrationFormData) =>
      client.users.createUserRegistration({
        email: data.email,
        roleIds: data.roleIds,
      }),
    onSuccess: (response) => {
      toast.success('Registration created successfully');
      queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
      createForm.reset();
      setCreateDialogOpen(false);
      setRegistrationUrl(response.registrationUrl);
      setSuccessDialogOpen(true);
    },
    onError: (error) => {
      toast.error('Failed to create registration', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!selectedRegistration) throw new Error('No registration selected');
      return client.users.revokeUserRegistration(selectedRegistration.id);
    },
    onSuccess: () => {
      toast.success('Registration revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
      setDeleteDialogOpen(false);
      setSelectedRegistration(null);
    },
    onError: (error) => {
      toast.error('Failed to revoke registration', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleDelete = (registration: { id: string; email: string }) => {
    setSelectedRegistration(registration);
    setDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (data: CreateRegistrationFormData) => {
    createMutation.mutate(data);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast.success('Registration URL copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">User Registrations</h2>
            <p className="text-muted-foreground mt-2">
              Manage user registration invitations
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
            <h2 className="text-3xl font-bold">User Registrations</h2>
            <p className="text-muted-foreground mt-2">
              Manage user registration invitations
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load registrations</p>
        </div>
      </div>
    );
  }

  const registrationsList = registrations || [];
  const isEmpty = registrationsList.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">User Registrations</h2>
          <p className="text-muted-foreground mt-2">
            Manage user registration invitations
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Registration
        </Button>
      </div>

      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MailIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">
                No registrations created yet
              </EmptyTitle>
              <EmptyDescription className="text-base">
                Get started by creating your first registration invitation
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                <Plus className="h-5 w-5" />
                Create Registration
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrationsList.map((registration) => {
                const isExpired = isAfter(
                  new Date(),
                  new Date(registration.expiresAt)
                );
                return (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.email}
                    </TableCell>
                    <TableCell>
                      {registration.roles?.map((r) => r.name).join(', ') || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(registration.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(registration.expiresAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          isExpired
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete({
                                id: registration.id,
                                email: registration.email,
                              })
                            }
                            className="text-destructive"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Registration Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create User Registration</DialogTitle>
            <DialogDescription>
              Create a registration invitation for a new user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-registration-email" required>
                      Email
                    </FieldLabel>
                    <Input
                      {...field}
                      id="create-registration-email"
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
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-registration-roles" required>
                      Roles
                    </FieldLabel>
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
                              id={`registration-role-${role.id}`}
                              checked={field.value.includes(role.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, role.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((id) => id !== role.id)
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`registration-role-${role.id}`}
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

      {/* Success Dialog with Registration URL */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Created</DialogTitle>
            <DialogDescription>
              Share this registration link with the user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <FieldLabel>Registration URL</FieldLabel>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={registrationUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy
                </Button>
              </div>
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

      {/* Delete Registration Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the registration for{' '}
              <span className="font-semibold">
                {selectedRegistration?.email}
              </span>
              ? This will invalidate the registration token and prevent the user
              from signing up.
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
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
