import { Button } from '@longpoint/ui/components/button';
import { Checkbox } from '@longpoint/ui/components/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
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
import { Plus, Trash2 } from 'lucide-react';
import { Control, Controller, useFieldArray } from 'react-hook-form';
import { ConfigSchemaField } from './config-schema-field';
import { getDefaultValueForType } from './config-schema-utils';

interface ArrayFieldProps {
  name: string;
  schemaValue: any;
  label: string;
  description?: string | null;
  required: boolean;
  immutable?: boolean;
  allowImmutableFields?: boolean;
  control: Control<any>;
  namePrefix: string;
}

export function ArrayField({
  name,
  schemaValue,
  label,
  description,
  required,
  immutable = false,
  allowImmutableFields = false,
  control,
  namePrefix,
}: ArrayFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });
  const minLen = Number(schemaValue?.minLength ?? (required ? 1 : 0));
  const maxLen = schemaValue?.maxLength;

  const itemSchema = schemaValue?.items || {};
  const itemType = itemSchema?.type;
  // Only disable immutable items if we're not allowing them (i.e., in edit mode)
  const itemImmutable = allowImmutableFields
    ? false
    : Boolean(itemSchema?.immutable);

  return (
    <Field>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
          {immutable && (
            <span className="ml-1 text-muted-foreground text-xs">
              (immutable)
            </span>
          )}
        </FieldLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(getDefaultValueForType(itemSchema))}
          disabled={immutable}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {description && (
        <FieldDescription>{String(description)}</FieldDescription>
      )}
      {minLen ? (
        <FieldDescription>
          Minimum {minLen} {minLen === 1 ? 'item' : 'items'}
        </FieldDescription>
      ) : null}
      {typeof maxLen === 'number' ? (
        <FieldDescription>Maximum {maxLen} items</FieldDescription>
      ) : null}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const baseName = `${name}.${index}`;
          const fieldId = `${namePrefix}-${baseName}`.replace(/\./g, '-');

          if (itemType === 'object') {
            const properties = itemSchema?.properties || {};
            return (
              <div
                key={field.id}
                className="rounded-lg border bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">
                    {label} item #{index + 1}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Remove item"
                    onClick={() => remove(index)}
                    disabled={immutable}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {Object.entries(properties).map(
                  ([propKey, propSchema]: [string, any]) => {
                    const propLabel = propSchema?.label ?? propKey;
                    const propDesc = (propSchema?.description as any) ?? null;
                    const propRequired = Boolean(propSchema?.required);
                    const fieldName = `${baseName}.${propKey}`;
                    // Only disable immutable fields if we're not allowing them (i.e., in edit mode)
                    const propImmutable = allowImmutableFields
                      ? false
                      : Boolean(propSchema?.immutable);
                    return (
                      <ConfigSchemaField
                        key={propKey}
                        name={fieldName}
                        schemaValue={propSchema}
                        label={propLabel}
                        description={propDesc}
                        required={propRequired}
                        immutable={propImmutable}
                        allowImmutableFields={allowImmutableFields}
                        control={control}
                        namePrefix={namePrefix}
                      />
                    );
                  }
                )}
              </div>
            );
          }

          // primitive array items
          const itemEnumValues = itemSchema?.enum;
          const hasEnum =
            itemEnumValues &&
            Array.isArray(itemEnumValues) &&
            itemEnumValues.length > 0;

          return (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Controller
                  name={baseName as any}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      {itemType === 'boolean' ? (
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor={fieldId} className="mr-4">
                            {label} item #{index + 1}
                          </FieldLabel>
                          <Checkbox
                            id={fieldId}
                            checked={Boolean(field.value)}
                            onCheckedChange={(v) => field.onChange(Boolean(v))}
                            aria-invalid={fieldState.invalid}
                            disabled={itemImmutable}
                          />
                        </div>
                      ) : hasEnum ? (
                        <>
                          <FieldLabel htmlFor={fieldId}>
                            {label} item #{index + 1}
                          </FieldLabel>
                          <Select
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            disabled={itemImmutable}
                          >
                            <SelectTrigger
                              id={fieldId}
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder={`Select ${label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {itemEnumValues.map((enumValue: string) => (
                                <SelectItem key={enumValue} value={enumValue}>
                                  {enumValue}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : itemType === 'number' ? (
                        <>
                          <FieldLabel htmlFor={fieldId}>
                            {label} item #{index + 1}
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
                            placeholder={label}
                            disabled={itemImmutable}
                          />
                        </>
                      ) : (
                        <>
                          <FieldLabel htmlFor={fieldId}>
                            {label} item #{index + 1}
                          </FieldLabel>
                          <Input
                            {...field}
                            id={fieldId}
                            aria-invalid={fieldState.invalid}
                            placeholder={label}
                            disabled={itemImmutable}
                          />
                        </>
                      )}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remove item"
                onClick={() => remove(index)}
                disabled={immutable}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </Field>
  );
}
