import { useClient } from '@/hooks/common/use-client';
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
import { MailIcon, MoreVertical, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function Registrations() {
  const client = useClient();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
        <p className="text-destructive">Failed to load registrations</p>
      </div>
    );
  }

  const registrationsList = registrations || [];
  const isEmpty = registrationsList.length === 0;

  return (
    <div className="space-y-8">
      {isEmpty ? (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MailIcon className="h-12 w-12" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No pending users</EmptyTitle>
              <EmptyDescription className="text-base">
                Add a new user to create a registration link.
              </EmptyDescription>
            </EmptyHeader>
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
                      <Badge variant={isExpired ? 'destructive' : 'default'}>
                        {isExpired ? 'Expired' : 'Active'}
                      </Badge>
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
                            variant="destructive"
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
