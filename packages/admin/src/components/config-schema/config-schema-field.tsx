import { Checkbox } from '@longpoint/ui/components/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { PasswordInput } from '@longpoint/ui/components/password-input';
import { Control, Controller } from 'react-hook-form';
import { ArrayField } from './array-field';
import { ObjectField } from './object-field';

interface ConfigSchemaFieldProps {
  name: string;
  schemaValue: any;
  label: string;
  description?: string | null;
  required: boolean;
  immutable?: boolean;
  placeholder?: string;
  allowImmutableFields?: boolean;
  control: Control<any>;
  namePrefix: string;
}

export function ConfigSchemaField({
  name,
  schemaValue,
  label,
  description,
  required,
  immutable = false,
  placeholder,
  allowImmutableFields = false,
  control,
  namePrefix,
}: ConfigSchemaFieldProps) {
  const type = schemaValue?.type;
  const fieldId = `${namePrefix}-${name}`.replace(/\./g, '-');

  if (type === 'array') {
    return (
      <ArrayField
        name={name}
        schemaValue={schemaValue}
        label={label}
        description={description}
        required={required}
        immutable={immutable}
        allowImmutableFields={allowImmutableFields}
        control={control}
        namePrefix={namePrefix}
      />
    );
  }

  if (type === 'object') {
    return (
      <ObjectField
        namePrefix={name}
        schemaValue={schemaValue}
        label={label}
        description={description}
        required={required}
        immutable={immutable}
        allowImmutableFields={allowImmutableFields}
        control={control}
        fieldNamePrefix={namePrefix}
      />
    );
  }

  if (type === 'boolean') {
    return (
      <Controller
        name={name as any}
        control={control}
        defaultValue={false as any}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={fieldId} className="mr-4">
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </FieldLabel>
              <Checkbox
                id={fieldId}
                checked={Boolean(field.value)}
                onCheckedChange={(v) => field.onChange(Boolean(v))}
                aria-invalid={fieldState.invalid}
                disabled={immutable}
              />
            </div>
            {description && (
              <FieldDescription>{String(description)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  if (type === 'number') {
    return (
      <Controller
        name={name as any}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FieldLabel>
            <Input
              id={fieldId}
              type="number"
              value={field.value ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === '' ? '' : Number(val));
              }}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              disabled={immutable}
            />
            {description && (
              <FieldDescription>{String(description)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  if (type === 'secret') {
    return (
      <Controller
        name={name as any}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={fieldId}>
              {label}
              {required && <span className="ml-1 text-destructive">*</span>}
            </FieldLabel>
            <PasswordInput
              {...field}
              id={fieldId}
              aria-invalid={fieldState.invalid}
              placeholder={placeholder}
              disabled={immutable}
            />
            {description && (
              <FieldDescription>{String(description)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  // default to string input
  return (
    <Controller
      name={name as any}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </FieldLabel>
          <Input
            {...field}
            id={fieldId}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            disabled={immutable}
          />
          {description && (
            <FieldDescription>{String(description)}</FieldDescription>
          )}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
