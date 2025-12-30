import { ComparisonOperator } from '@longpoint/types';
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
import { Control, Controller } from 'react-hook-form';
import { getFieldDefinition } from './rule-field-schema';

interface ValueInputProps {
  control: Control<any>;
  name: string;
  triggerEvent: string;
  fieldPath: string;
  operator: ComparisonOperator;
  value?: unknown;
  onChange?: (value: unknown) => void;
}

export function ValueInput({
  control,
  name,
  triggerEvent,
  fieldPath,
  operator,
  value,
  onChange,
}: ValueInputProps) {
  const fieldDef = getFieldDefinition(triggerEvent, fieldPath);
  const needsArrayValue =
    operator === ComparisonOperator.IN ||
    operator === ComparisonOperator.NOT_IN;

  if (!fieldDef) {
    // Fallback to text input if field definition not found (backward compatibility)
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: 'Value is required' }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel required>Value</FieldLabel>
            {needsArrayValue ? (
              <div className="space-y-2">
                <Input
                  placeholder="a, b, c"
                  value={
                    Array.isArray(field.value) ? field.value.join(', ') : ''
                  }
                  onChange={(e) => {
                    const values = e.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter((v) => v.length > 0);
                    field.onChange(values);
                    if (onChange) onChange(values);
                  }}
                />
                <FieldDescription>
                  Enter multiple values separated by commas
                </FieldDescription>
              </div>
            ) : (
              <Input
                {...field}
                placeholder="Enter value"
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (onChange) onChange(e.target.value);
                }}
              />
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  // Enum field with array operators
  if (fieldDef.type === 'enum' && needsArrayValue) {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: 'Value is required' }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel required>Value</FieldLabel>
            <Input
              placeholder="a, b, c"
              value={Array.isArray(field.value) ? field.value.join(', ') : ''}
              onChange={(e) => {
                const values = e.target.value
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v) => v.length > 0);
                field.onChange(values);
                if (onChange) onChange(values);
              }}
            />
            <FieldDescription>
              {fieldDef.description ||
                'Enter multiple values separated by commas'}
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  // Enum field with single value operators
  if (fieldDef.type === 'enum' && !needsArrayValue) {
    const needsTextInput =
      operator === ComparisonOperator.STARTS_WITH ||
      operator === ComparisonOperator.ENDS_WITH;

    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: 'Value is required' }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel required>Value</FieldLabel>
            {needsTextInput ? (
              <Input
                {...field}
                placeholder="Enter value"
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  if (onChange) onChange(e.target.value);
                }}
              />
            ) : (
              <Select
                value={String(field.value || '')}
                onValueChange={(val) => {
                  field.onChange(val);
                  if (onChange) onChange(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {fieldDef.enumValues?.map((enumValue) => {
                    if (typeof enumValue === 'string') {
                      return (
                        <SelectItem key={enumValue} value={enumValue}>
                          {enumValue}
                        </SelectItem>
                      );
                    }
                    return (
                      <SelectItem key={enumValue.value} value={enumValue.value}>
                        {enumValue.label || enumValue.value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            {fieldDef.description && (
              <FieldDescription>{fieldDef.description}</FieldDescription>
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  // Number field
  if (fieldDef.type === 'number') {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: 'Value is required' }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel required>Value</FieldLabel>
            {needsArrayValue ? (
              <div className="space-y-2">
                <Input
                  placeholder="Enter numbers separated by commas"
                  value={
                    Array.isArray(field.value)
                      ? field.value.map(String).join(', ')
                      : ''
                  }
                  onChange={(e) => {
                    const values = e.target.value
                      .split(',')
                      .map((v) => {
                        const num = Number(v.trim());
                        return isNaN(num) ? null : num;
                      })
                      .filter((v) => v !== null);
                    field.onChange(values);
                    if (onChange) onChange(values);
                  }}
                />
                <FieldDescription>
                  Enter multiple numbers separated by commas
                </FieldDescription>
              </div>
            ) : (
              <Input
                {...field}
                type="number"
                placeholder="Enter number"
                value={field.value ?? ''}
                onChange={(e) => {
                  const num =
                    e.target.value === '' ? null : Number(e.target.value);
                  field.onChange(num);
                  if (onChange) onChange(num);
                }}
              />
            )}
            {fieldDef.description && (
              <FieldDescription>{fieldDef.description}</FieldDescription>
            )}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  // String or metadata field
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: 'Value is required' }}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel required>Value</FieldLabel>
          {needsArrayValue ? (
            <div className="space-y-2">
              <Input
                placeholder="a, b, c"
                value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                onChange={(e) => {
                  const values = e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v.length > 0);
                  field.onChange(values);
                  if (onChange) onChange(values);
                }}
              />
              <FieldDescription>
                {fieldDef.description ||
                  'Enter multiple values separated by commas'}
              </FieldDescription>
            </div>
          ) : (
            <Input
              {...field}
              placeholder="Enter value"
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value);
                if (onChange) onChange(e.target.value);
              }}
            />
          )}
          {!needsArrayValue && fieldDef.description && (
            <FieldDescription>{fieldDef.description}</FieldDescription>
          )}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
