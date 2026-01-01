import { useClient } from '@/hooks/common/use-client';
import { components } from '@longpoint/sdk';
import { Button } from '@longpoint/ui/components/button';
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
import { Move3dIcon, PlusIcon, ScanSearchIcon, XIcon } from 'lucide-react';
import { Control, Controller, useFieldArray } from 'react-hook-form';

type RuleAction = components['schemas']['RuleDetails']['actions'][number];

interface RuleActionFormProps {
  control: Control<any>;
  name: string;
}

export function RuleActionForm({ control, name }: RuleActionFormProps) {
  const client = useClient();

  const { data: classifierTemplates, isLoading: classifiersLoading } = useQuery(
    {
      queryKey: ['classifier-templates'],
      queryFn: () => client.classifiers.listTemplates(),
    }
  );

  const { data: transformerTemplates, isLoading: transformsLoading } = useQuery(
    {
      queryKey: ['transformer-templates'],
      queryFn: () => client.transformers.listTemplates(),
    }
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name,
    rules: { minLength: 1 },
  });

  const addAction = () => {
    append({
      type: 'RUN_CLASSIFIER',
      classifierTemplateId: '',
    });
  };

  return (
    <FieldGroup>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">#{index + 1}</span>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                >
                  <XIcon />
                </Button>
              )}
            </div>

            <SingleActionForm
              control={control}
              name={`${name}.${index}`}
              classifierTemplates={classifierTemplates?.items || []}
              transformerTemplates={transformerTemplates?.items || []}
              classifiersLoading={classifiersLoading}
              transformsLoading={transformsLoading}
            />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addAction}>
          <PlusIcon />
          Add Action
        </Button>
      </div>
    </FieldGroup>
  );
}

interface SingleActionFormProps {
  control: Control<any>;
  name: string;
  classifierTemplates: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  transformerTemplates: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  classifiersLoading: boolean;
  transformsLoading: boolean;
}

function SingleActionForm({
  control,
  name,
  classifierTemplates,
  transformerTemplates,
  classifiersLoading,
  transformsLoading,
}: SingleActionFormProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: 'Action is required' }}
      render={({ field, fieldState }) => {
        const value = field.value as RuleAction | undefined;
        const actionType = value?.type || 'RUN_CLASSIFIER';

        return (
          <FieldGroup>
            <Controller
              name={`${name}.type`}
              control={control}
              rules={{ required: 'Action type is required' }}
              render={({ field: typeField, fieldState: typeFieldState }) => (
                <Field
                  data-invalid={typeFieldState.invalid}
                  className="max-w-2xs"
                >
                  <FieldLabel required>Action</FieldLabel>
                  <Select
                    value={typeField.value || 'RUN_CLASSIFIER'}
                    onValueChange={(val) => {
                      typeField.onChange(val);
                      // Reset action based on type
                      if (val === 'RUN_CLASSIFIER') {
                        field.onChange({
                          type: 'RUN_CLASSIFIER',
                          classifierTemplateId: '',
                        });
                      } else {
                        field.onChange({
                          type: 'RUN_TRANSFORMER',
                          transformerTemplateId: '',
                          sourceVariantId: '{{variant.id}}',
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RUN_CLASSIFIER">
                        <ScanSearchIcon />
                        Run Classifier
                      </SelectItem>
                      <SelectItem value="RUN_TRANSFORMER">
                        <Move3dIcon />
                        Run Transformer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {typeFieldState.error && (
                    <FieldError errors={[typeFieldState.error]} />
                  )}
                </Field>
              )}
            />

            {actionType === 'RUN_CLASSIFIER' ? (
              <RunClassifierActionForm
                control={control}
                name={name}
                classifierTemplates={classifierTemplates}
                isLoading={classifiersLoading}
              />
            ) : (
              <RunTransformerActionForm
                control={control}
                name={name}
                transformerTemplates={transformerTemplates}
                isLoading={transformsLoading}
              />
            )}

            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </FieldGroup>
        );
      }}
    />
  );
}

interface RunClassifierActionFormProps {
  control: Control<any>;
  name: string;
  classifierTemplates: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  isLoading: boolean;
}

function RunClassifierActionForm({
  control,
  name,
  classifierTemplates,
  isLoading,
}: RunClassifierActionFormProps) {
  return (
    <Controller
      name={`${name}.classifierTemplateId`}
      control={control}
      rules={{ required: 'Classifier template is required' }}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="max-w-2xs">
          <FieldLabel required>Template</FieldLabel>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={field.value || ''} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a classifier template" />
              </SelectTrigger>
              <SelectContent>
                {classifierTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.displayName || template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

interface RunTransformerActionFormProps {
  control: Control<any>;
  name: string;
  transformerTemplates: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  isLoading: boolean;
}

function RunTransformerActionForm({
  control,
  name,
  transformerTemplates,
  isLoading,
}: RunTransformerActionFormProps) {
  return (
    <>
      <Controller
        name={`${name}.transformerTemplateId`}
        control={control}
        rules={{ required: 'Transformer template is required' }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="max-w-2xs">
            <FieldLabel required>Template</FieldLabel>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a transformer template" />
                </SelectTrigger>
                <SelectContent>
                  {transformerTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.displayName || template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={`${name}.sourceVariantId`}
        control={control}
        rules={{ required: 'Source variant ID is required' }}
        defaultValue="{{variant.id}}"
        render={({ field, fieldState }) => {
          const isEventVariant = field.value === '{{variant.id}}';
          const mode = isEventVariant ? 'event' : 'custom';

          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel required>Source Variant</FieldLabel>
              <Select
                value={mode}
                onValueChange={(val) => {
                  if (val === 'event') {
                    field.onChange('{{variant.id}}');
                  } else if (isEventVariant) {
                    // Switching from event to custom - clear the field
                    field.onChange('');
                  }
                  // If already in custom mode, keep the existing value
                }}
              >
                <SelectTrigger className="max-w-2xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event Variant ID</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'custom' && (
                <div className="mt-2 max-w-2xs">
                  <Input
                    {...field}
                    placeholder="{{variant.id}} or a specific variant ID"
                  />
                </div>
              )}
              <FieldDescription>
                {isEventVariant
                  ? 'Uses the variant ID from the event context'
                  : 'Enter a variant ID or template expression (e.g. {{variant.id}})'}
              </FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
    </>
  );
}
