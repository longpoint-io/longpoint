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
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

export function CreateClassifier() {
  const client = useClient();
  const navigate = useNavigate();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['classification-providers'],
    queryFn: () => client.analysis.listClassificationProviders(),
  });

  const selectedProvider = providers?.find(
    (p) => p.fullyQualifiedId === selectedModelId
  );

  const formSchema = z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Name must be lowercase letters, numbers, and hyphens only'
      ),
    description: z.string().optional(),
    modelInput: z.record(z.string(), z.any()).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      modelInput: {},
    },
  });

  const handleSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (
    data
  ) => {
    if (!selectedModelId) {
      toast.error('Please select a model');
      return;
    }

    // Validate model input (including nested objects/arrays)
    const schema: Record<string, any> | undefined =
      selectedProvider?.classifierInputSchema;
    const values = form.getValues() as any;
    const isValid = validateConfigSchemaForm(
      schema,
      values?.modelInput,
      'modelInput',
      form.setError
    );
    if (!isValid) return;

    try {
      // Include dynamic modelInput when present
      const payload: any = {
        ...data,
        modelId: selectedModelId,
      };
      if (payload.description === '') payload.description = null;
      if (values?.modelInput) {
        payload.modelInput = values.modelInput;
      }
      const result = await client.analysis.createClassifier(payload);

      toast.success('Classifier created successfully');
      navigate(`/classifiers/${result.id}`);
    } catch (error) {
      toast.error('Failed to create classifier', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/classifiers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Create Classifier</h2>
          <p className="text-muted-foreground mt-2">
            Set up a new AI classifier for your media
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Name and describe your classifier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="classifier-name">
                        Classifier Name
                      </FieldLabel>
                      <Input
                        {...field}
                        id="classifier-name"
                        placeholder="general-tagging"
                      />
                      <FieldDescription>
                        A unique identifier for your classifier (lowercase,
                        hyphens only)
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
                      <FieldLabel htmlFor="classifier-description">
                        Description
                      </FieldLabel>
                      <Input
                        {...field}
                        id="classifier-description"
                        placeholder="Tag general subjects like people, places, and things"
                      />
                      <FieldDescription>
                        Optional description of what this classifier does
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
              <CardTitle>Model Selection</CardTitle>
              <CardDescription>
                Choose the AI model to use for this classifier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {providersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Field>
                  <FieldLabel htmlFor="classifier-model">
                    Classification Provider
                  </FieldLabel>
                  <Select
                    value={selectedModelId || undefined}
                    onValueChange={setSelectedModelId}
                  >
                    <SelectTrigger id="classifier-model" className="w-full">
                      <SelectValue placeholder="Select a classification provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers?.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.fullyQualifiedId}
                        >
                          <div className="flex items-center gap-2">
                            <span>{provider.displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              ({provider.pluginId})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Select the classification provider to use
                  </FieldDescription>
                </Field>
              )}
            </CardContent>
          </Card>

          {selectedModelId && (
            <Card>
              <CardHeader>
                <CardTitle>Model Input</CardTitle>
                <CardDescription>
                  Provide configuration required by the selected model
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProvider ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  selectedProvider &&
                  selectedProvider.classifierInputSchema && (
                    <ConfigSchemaForm
                      schema={selectedProvider.classifierInputSchema as any}
                      control={form.control}
                      namePrefix="modelInput"
                      setError={form.setError}
                      allowImmutableFields={true}
                    />
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/classifiers')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedModelId}>
            Create Classifier
          </Button>
        </div>
      </form>
    </div>
  );
}
