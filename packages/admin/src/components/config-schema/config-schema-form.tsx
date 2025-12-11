import { ConfigSchemaDefinition } from '@longpoint/config-schema';
import { FieldGroup } from '@longpoint/ui/components/field';
import { Control, UseFormSetError } from 'react-hook-form';
import { ConfigSchemaField } from './config-schema-field';
import { validateConfigSchema } from './config-schema-utils';

// Allow for more flexible schema types from API responses
type FlexibleConfigSchema = {
  [key: string]: {
    label: string;
    type: string;
    required?: boolean;
    description?: string | null;
    immutable?: boolean | null;
    minLength?: number | null;
    maxLength?: number | null;
    enum?: string[];
    items?: {
      type: string;
      properties?: FlexibleConfigSchema;
      immutable?: boolean | null;
      minLength?: number | null;
      maxLength?: number | null;
      enum?: string[];
    } | null;
    properties?: FlexibleConfigSchema;
  };
};

export interface ConfigSchemaFormProps {
  schema: ConfigSchemaDefinition | FlexibleConfigSchema;
  control: Control<any>;
  namePrefix?: string;
  setError?: UseFormSetError<any>;
  /**
   * If true, allows immutable fields to be set (for create operations).
   * If false, immutable fields are disabled (for edit operations).
   * @default false
   */
  allowImmutableFields?: boolean;
}

/**
 * Validates the config schema form values
 * This should be called before form submission
 */
export function validateConfigSchemaForm(
  schema: ConfigSchemaDefinition | FlexibleConfigSchema | undefined,
  values: any,
  namePrefix: string,
  setError: UseFormSetError<any>
): boolean {
  return validateConfigSchema(
    schema as ConfigSchemaDefinition,
    values,
    namePrefix,
    setError
  );
}

export function ConfigSchemaForm({
  schema,
  control,
  namePrefix = '',
  setError,
  allowImmutableFields = false,
}: ConfigSchemaFormProps) {
  return (
    <FieldGroup>
      {Object.entries(schema).map(([key, value]: [string, any]) => {
        const label = value?.label ?? key;
        const description = (value?.description as any) ?? null;
        const required = Boolean(value?.required);
        const placeholder = value?.placeholder;
        // Only disable immutable fields if we're not allowing them (i.e., in edit mode)
        const immutable = allowImmutableFields
          ? false
          : Boolean(value?.immutable);
        const fieldName = namePrefix ? `${namePrefix}.${key}` : key;
        const fieldNamePrefix = namePrefix || 'config';

        return (
          <ConfigSchemaField
            key={key}
            name={fieldName}
            schemaValue={value}
            label={label}
            description={description}
            required={required}
            immutable={immutable}
            placeholder={placeholder}
            allowImmutableFields={allowImmutableFields}
            control={control}
            namePrefix={fieldNamePrefix}
          />
        );
      })}
    </FieldGroup>
  );
}

// Export utility function for consumers who need to validate manually
export { getDefaultValueForType } from './config-schema-utils';
