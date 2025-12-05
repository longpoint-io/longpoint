import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpload } from '@longpoint/react';
import { SupportedMimeType } from '@longpoint/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@longpoint/ui/components/avatar';
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
import { Spinner } from '@longpoint/ui/components/spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Site name is required')
    .max(100, 'Site name must be at most 100 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function GeneralSettings() {
  const client = useClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const uploadHook = useUpload();

  const {
    data: systemStatus,
    isLoading: systemStatusLoading,
    error: systemStatusError,
  } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => client.system.getSystemStatus(),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: systemStatus?.name || '',
    },
    values: {
      name: systemStatus?.name || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; logoAssetId?: string }) => {
      return client.system.updateSystemSettings(data);
    },
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
    onError: (error) => {
      toast.error('Failed to update settings', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    },
  });

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const mimeType = file.type as SupportedMimeType;
    if (!Object.values(SupportedMimeType).includes(mimeType)) {
      toast.error('Unsupported file type', {
        description: 'Please select an image file',
      });
      return;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file',
      });
      return;
    }

    setLogoUploading(true);

    try {
      // Create asset
      const asset = await client.assets.createAsset({
        mimeType: mimeType,
        name: file.name,
      });

      // Upload file
      await uploadHook.uploadFile(file, asset.url);

      // Poll for asset to be ready, then update settings
      const maxAttempts = 30; // 30 attempts (30 seconds max)
      const delayMs = 1000; // 1 second between attempts
      let attempts = 0;
      let assetReady = false;

      while (attempts < maxAttempts && !assetReady) {
        try {
          const assetStatus = await client.assets.getAsset(asset.id);
          if (assetStatus.status === 'READY') {
            assetReady = true;
            await updateMutation.mutateAsync({
              logoAssetId: asset.id,
            });
            break;
          } else if (assetStatus.status === 'FAILED') {
            throw new Error('Asset processing failed');
          }
        } catch (error) {
          // If update fails, check if it's because asset isn't ready
          if (error instanceof Error && error.message.includes('not ready')) {
            // Continue polling
          } else if (
            error instanceof Error &&
            error.message.includes('Asset processing failed')
          ) {
            throw error;
          } else {
            // Try updating anyway - backend will validate
            try {
              await updateMutation.mutateAsync({
                logoAssetId: asset.id,
              });
              assetReady = true;
              break;
            } catch (updateError) {
              // If still not ready, continue polling
              if (
                updateError instanceof Error &&
                updateError.message.includes('not ready')
              ) {
                // Continue polling
              } else {
                throw updateError;
              }
            }
          }
        }

        attempts++;
        if (attempts < maxAttempts && !assetReady) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      if (!assetReady) {
        throw new Error(
          'Asset is still processing. Please try again in a moment.'
        );
      }

      setLogoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setLogoUploading(false);
      toast.error('Failed to upload logo', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate({ name: data.name });
  });

  if (systemStatusLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (systemStatusError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load settings:{' '}
            {systemStatusError instanceof Error
              ? systemStatusError.message
              : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Basic configuration for your instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  disabled={logoUploading || updateMutation.isPending}
                  className="relative cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Avatar className="h-16 w-16 rounded-full border-[0.5px]">
                    {logoUploading ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage
                          src={systemStatus?.logoUrl ?? undefined}
                          alt="Site logo"
                        />
                        <AvatarFallback className="rounded-full border text-lg">
                          {systemStatus?.name?.charAt(0)?.toUpperCase() || 'L'}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                </button>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Click the logo to upload a new image
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
            </Field>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="site-name">System Name</FieldLabel>
                  <Input
                    {...field}
                    id="site-name"
                    placeholder="My Longpoint Site"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="max-w-xs"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={updateMutation.isPending || logoUploading}
            isLoading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
