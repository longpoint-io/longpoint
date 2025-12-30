import {
  ConfigSchemaForm,
  validateConfigSchemaForm,
} from '@/components/config-schema';
import { useClient } from '@/hooks/common/use-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { components } from '@longpoint/sdk';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { Skeleton } from '@longpoint/ui/components/skeleton';
import { cn } from '@longpoint/ui/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import * as z from 'zod';

export function CreateClassifier() {
  const client = useClient();
  const navigate = useNavigate();
  const [selectedClassifierId, setSelectedClassifierId] = useState<
    string | null
  >(null);

  const { data: classifiers, isLoading: classifiersLoading } = useQuery({
    queryKey: ['classifiers'],
    queryFn: () => client.classifiers.list(),
  });

  const selectedClassifier = classifiers?.find(
    (c) => c.id === selectedClassifierId
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
    if (!selectedClassifierId) {
      toast.error('Please select a model');
      return;
    }

    // Validate model input (including nested objects/arrays)
    const schema: Record<string, any> | undefined =
      selectedClassifier?.inputSchema;
    const values = form.getValues() as any;
    const isValid = validateConfigSchemaForm(
      schema,
      values?.modelInput,
      'modelInput',
      form.setError
    );
    if (!isValid) return;

    try {
      const result = await client.classifiers.createTemplate({
        name: data.name,
        description: data.description ?? null,
        input: values?.modelInput,
        classifierId: selectedClassifierId,
      });

      toast.success('Classifier template created successfully');
      navigate(`/classifier-templates/${result.id}`);
    } catch (error) {
      toast.error('Failed to create classifier', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    }
  };

  const classifiersByPluginId = useMemo(() => {
    return classifiers?.reduce((acc, classifier) => {
      const pluginId = classifier.id.split('/')[0];
      acc[pluginId] = [...(acc[pluginId] || []), classifier];
      return acc;
    }, {} as Record<string, components['schemas']['Classifier'][]>);
  }, [classifiers]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold">Create Classifier Template</h2>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="template-name">Name</FieldLabel>
                      <Input
                        {...field}
                        id="template-name"
                        placeholder="general-tagging"
                      />
                      <FieldDescription>
                        An identifier for the classifier template (lowercase,
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
                      <FieldLabel htmlFor="template-description">
                        Description
                      </FieldLabel>
                      <Input
                        {...field}
                        id="template-description"
                        placeholder="Tag general subjects like people, places, and things"
                      />

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                {classifiersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Field>
                    <FieldLabel htmlFor="classifier-model">
                      Classifier
                    </FieldLabel>
                    <Select
                      value={selectedClassifierId || undefined}
                      onValueChange={setSelectedClassifierId}
                    >
                      <SelectTrigger
                        id="classifier-model"
                        className={cn('text-left max-w-xs', {
                          '!h-12': selectedClassifierId,
                        })}
                      >
                        <SelectValue placeholder="Select an installed classifier" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(classifiersByPluginId || {}).map(
                          ([pluginId, classifiers]) => (
                            <SelectGroup key={pluginId}>
                              <SelectLabel>{pluginId}</SelectLabel>
                              {classifiers.map((classifier) => (
                                <SelectItem
                                  key={classifier.id}
                                  value={classifier.id}
                                >
                                  <div className="flex flex-col">
                                    <span>{classifier.displayName}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {classifier.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </FieldGroup>
            </CardContent>
          </Card>

          {selectedClassifierId &&
            selectedClassifier &&
            Object.keys(selectedClassifier.inputSchema).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Input</CardTitle>
                  <CardDescription>
                    Provide input values for the selected classifier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedClassifier ? (
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    selectedClassifier &&
                    selectedClassifier.inputSchema && (
                      <ConfigSchemaForm
                        schema={selectedClassifier.inputSchema as any}
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
            onClick={() => navigate('/classifier-templates')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedClassifierId}>
            Create Classifier
          </Button>
        </div>
      </form>
    </div>
  );
}
