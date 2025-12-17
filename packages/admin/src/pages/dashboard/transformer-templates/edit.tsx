import {
  ConfigSchemaForm,
  validateConfigSchemaForm,
} from '@/components/config-schema';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@longpoint/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@longpoint/ui/components/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

export function EditTransformerTemplate() {
  const { templateId } = useParams<{ templateId: string }>();
  const client = useClient();
  const navigate = useNavigate();
  const [selectedTransformerId, setSelectedTransformerId] = useState<
    string | null
  >(null);

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['transformer-template', templateId],
    queryFn: () => client.transform.getTransformerTemplate(templateId!),
    enabled: !!templateId,
  });

  const { data: transformers, isLoading: transformersLoading } = useQuery({
    queryKey: ['transformers'],
    queryFn: () => client.transform.listTransformers(),
  });

  // Use selectedTransformerId if set, otherwise use the template's transformerId
  const currentTransformerId = selectedTransformerId || template?.transformerId;

  const { data: transformerDetails, isLoading: transformerDetailsLoading } =
    useQuery({
      queryKey: ['transformer', currentTransformerId],
      queryFn: () => client.transform.getTransformer(currentTransformerId!),
      enabled: !!currentTransformerId,
    });

  const inputSchema = transformerDetails?.inputSchema;

  const formSchema = z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Name must be lowercase letters, numbers, and hyphens only'
      ),
    displayName: z.string().optional(),
    description: z.string().optional(),
    transformerId: z.string().min(1, 'Transformer is required'),
    input: z.record(z.string(), z.any()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      transformerId: '',
      input: {},
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        displayName: template.displayName || '',
        description: template.description || '',
        transformerId: template.transformerId,
        input: template.input || {},
      });
      setSelectedTransformerId(template.transformerId);
    }
  }, [template, form]);

  const handleSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (
    data
  ) => {
    if (!templateId) return;

    // Validate input if schema exists
    if (inputSchema) {
      const values = form.getValues() as any;
      const isValid = validateConfigSchemaForm(
        inputSchema,
        values?.input,
        'input',
        form.setError
      );
      if (!isValid) return;
    }

    try {
      const payload: any = {
        name: data.name,
      };

      if (data.displayName && data.displayName.trim() !== '') {
        payload.displayName = data.displayName;
      }

      if (data.description && data.description.trim() !== '') {
        payload.description = data.description;
      } else {
        payload.description = null;
      }

      // Only include transformerId if it changed
      if (data.transformerId !== template.transformerId) {
        payload.transformerId = data.transformerId;
      }

      const values = form.getValues() as any;
      if (values?.input) {
        payload.input = values.input;
      }

      await client.transform.updateTransformerTemplate(templateId, payload);

      toast.success('Transformer template updated successfully');
      navigate(`/transformer/templates/${templateId}`);
    } catch (error) {
      toast.error('Failed to update transformer template', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  };

  if (templateLoading) {
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

  if (!template) {
    return (
      <div className="space-y-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/transformer/templates')}
        >
          Back to Transformer Templates
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">Transformer template not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold">Edit Transformer Template</h2>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Name and describe your transformer template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="template-name">
                        Template Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="template-name"
                        placeholder="ipod-video"
                      />
                      <FieldDescription>
                        A unique identifier for your template (lowercase,
                        hyphens only)
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="displayName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="template-display-name">
                        Display Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="template-display-name"
                        placeholder="iPod Video"
                      />
                      <FieldDescription>
                        Optional display name for the template
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="template-description">
                        Description
                      </FieldLabel>
                      <Input
                        {...field}
                        id="template-description"
                        placeholder="Convert videos to a watchable format for 5th generation iPods"
                      />
                      <FieldDescription>
                        Optional description of what this template does
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transformer</CardTitle>
              <CardDescription>
                The transformer used by this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transformersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Field>
                  <FieldLabel htmlFor="template-transformer">
                    Transformer
                  </FieldLabel>
                  <Controller
                    name="transformerId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedTransformerId(value);
                            // Reset input when transformer changes
                            form.setValue('input', {});
                          }}
                        >
                          <SelectTrigger
                            id="template-transformer"
                            className="w-full"
                          >
                            <SelectValue placeholder="Select a transformer" />
                          </SelectTrigger>
                          <SelectContent>
                            {transformers?.items?.map((transformer) => (
                              <SelectItem
                                key={transformer.id}
                                value={transformer.id}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{transformer.displayName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({transformer.id})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </>
                    )}
                  />
                  {transformerDetails?.description && (
                    <FieldDescription>
                      {transformerDetails.description}
                    </FieldDescription>
                  )}
                </Field>
              )}
            </CardContent>
          </Card>

          {currentTransformerId && (
            <Card>
              <CardHeader>
                <CardTitle>Transformer Input</CardTitle>
                <CardDescription>
                  Provide configuration required by the selected transformer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transformerDetailsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : inputSchema ? (
                  <ConfigSchemaForm
                    schema={inputSchema as any}
                    control={form.control}
                    namePrefix="input"
                    setError={form.setError}
                    allowImmutableFields={false}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This transformer does not require any input configuration.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/transformer/templates/${templateId}`)}
          >
            Cancel
          </Button>
          <Button type="submit">Update Transformer Template</Button>
        </div>
      </form>
    </div>
  );
}
