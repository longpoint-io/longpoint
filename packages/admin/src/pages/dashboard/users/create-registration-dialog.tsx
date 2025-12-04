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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const createRegistrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

type CreateRegistrationFormData = z.infer<typeof createRegistrationSchema>;

interface CreateRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (registrationUrl: string) => void;
}

export function CreateRegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRegistrationDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => client.users.listRoles(),
  });

  const form = useForm<CreateRegistrationFormData>({
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
      form.reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(response.registrationUrl);
      }
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

  const handleSubmit = (data: CreateRegistrationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User Registration</DialogTitle>
          <DialogDescription>
            Create a registration invitation for a new user
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
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
              control={form.control}
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
                        <div key={role.id} className="flex items-center gap-2">
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
              onClick={() => onOpenChange(false)}
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
  );
}
