import { authClient, useAuth } from '@/auth';
import { useSetupStatus } from '@/hooks/domain/use-setup-status';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be at most 50 characters.'),
  email: z
    .email('Please enter a valid email address.')
    .min(1, 'Email is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be at most 100 characters.'),
});

export function FirstAdminSetup() {
  const navigate = useNavigate();
  const { refetch } = useSetupStatus();
  const { refreshSession } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const result = await authClient.signUp.email({
        email: data.email,
        name: data.name,
        password: data.password,
      });

      if (result.error) {
        toast.error('Error creating account', {
          description: result.error.message,
        });
        return;
      }

      // Refetch setup status to update the guards
      await refetch();

      // Refresh the session to ensure the auth context is updated
      await refreshSession();

      toast.success('Welcome to Longpoint!');
      navigate('/');
    } catch (error) {
      toast.error('Error creating account', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }

  return (
    <Card className="w-full sm:max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">
          Welcome to Longpoint
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Create your first administrator account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="first-admin-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="first-admin-form-name">
                    Full Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="first-admin-form-name"
                    type="text"
                    placeholder="Enter your full name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="first-admin-form-email">
                    Email Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="first-admin-form-email"
                    type="email"
                    placeholder="Enter your email address"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="first-admin-form-password">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="first-admin-form-password"
                    type="password"
                    placeholder="Create a secure password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="vertical">
          <Button
            type="submit"
            form="first-admin-form"
            disabled={form.formState.isSubmitting}
            isLoading={form.formState.isSubmitting}
          >
            Create Account
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
