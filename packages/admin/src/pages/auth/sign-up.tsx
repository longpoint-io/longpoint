import { authClient, useAuth } from '@/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Longpoint } from '@longpoint/sdk';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@longpoint/ui/components/alert';
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
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be at most 50 characters.'),
  email: z
    .string()
    .email('Please enter a valid email address.')
    .min(1, 'Email is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be at most 100 characters.'),
});

export function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const token = searchParams.get('token');

  // Create a public client for fetching registration (no auth required)
  const publicClient = useMemo(
    () =>
      new Longpoint({
        baseUrl: import.meta.env.DEV ? 'http://localhost:3000/api' : '/api',
      }),
    []
  );

  const {
    data: registration,
    isLoading: isLoadingRegistration,
    error: registrationError,
  } = useQuery({
    queryKey: ['user-registration', token],
    queryFn: () => {
      if (!token) throw new Error('No token provided');
      return publicClient.users.getUserRegistration(token);
    },
    enabled: !!token,
    retry: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Update email when registration loads
  if (registration && form.getValues('email') !== registration.email) {
    form.setValue('email', registration.email);
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error('Invalid registration link', {
        description: 'No registration token found in the URL',
      });
      return;
    }

    if (registration && data.email !== registration.email) {
      toast.error('Email mismatch', {
        description: 'The email must match the registration email',
      });
      return;
    }

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        name: data.name,
        password: data.password,
        fetchOptions: {
          query: {
            token: token,
          },
        },
      });

      if (result.error) {
        toast.error('Sign up failed', { description: result.error.message });
        return;
      }

      // Refresh the session to ensure the auth context is updated
      await refreshSession();

      toast.success('Account created successfully!');
      navigate('/sign-in');
    } catch (error) {
      toast.error('Sign up failed', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  }

  if (!token) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Invalid Link</CardTitle>
          <CardDescription className="text-muted-foreground">
            This registration link is invalid or missing a token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Invalid Registration Link</AlertTitle>
            <AlertDescription>
              Please contact your administrator for a valid registration link.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => navigate('/sign-in')}
            className="w-full"
          >
            Go to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoadingRegistration) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Sign Up</CardTitle>
          <CardDescription className="text-muted-foreground">
            Loading registration details...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (registrationError || !registration) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Invalid Link</CardTitle>
          <CardDescription className="text-muted-foreground">
            This registration link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Registration Not Found</AlertTitle>
            <AlertDescription>
              {registrationError instanceof Error
                ? registrationError.message
                : 'The registration link may have expired or been revoked. Please contact your administrator for a new registration link.'}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => navigate('/sign-in')}
            className="w-full"
          >
            Go to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold">Sign Up</CardTitle>
        <CardDescription className="text-muted-foreground">
          Complete your registration to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sign-up-form-name" required>
                    Full Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-form-name"
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
                  <FieldLabel htmlFor="sign-up-form-email" required>
                    Email Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-form-email"
                    type="email"
                    placeholder="Enter your email address"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                    disabled
                    className="bg-muted"
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
                  <FieldLabel htmlFor="sign-up-form-password" required>
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="sign-up-form-password"
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
        <Field orientation="horizontal">
          <Button
            type="submit"
            form="sign-up-form"
            className="w-full"
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
