import { getTriggerEventSchema } from '@/pages/dashboard/rules/rule-field-schema';
import { Field, FieldError, FieldLabel } from '@longpoint/ui/components/field';
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
import { useEffect, useState } from 'react';
import { Control, Controller } from 'react-hook-form';

interface FieldPathSelectorProps {
  control: Control<any>;
  name: string;
  triggerEvent: string;
  value?: string;
  onChange?: (fieldPath: string) => void;
}

export function FieldPathSelector({
  control,
  name,
  triggerEvent,
  value,
  onChange,
}: FieldPathSelectorProps) {
  const schema = getTriggerEventSchema(triggerEvent);
  const [selectedFieldPath, setSelectedFieldPath] = useState<string>(() => {
    return value || '';
  });

  const [metadataPath, setMetadataPath] = useState<string>(() => {
    if (value?.startsWith('variant.metadata.')) {
      return value.replace('variant.metadata.', '');
    }
    return '';
  });

  const isMetadataField = selectedFieldPath === 'variant.metadata';

  // Sync external value changes
  useEffect(() => {
    if (value && value !== selectedFieldPath) {
      if (value.startsWith('variant.metadata.')) {
        setSelectedFieldPath('variant.metadata');
        setMetadataPath(value.replace('variant.metadata.', ''));
      } else {
        setSelectedFieldPath(value);
        setMetadataPath('');
      }
    }
  }, [value, selectedFieldPath]);

  const handleFieldChange = (fieldPath: string) => {
    setSelectedFieldPath(fieldPath);
    if (fieldPath === 'variant.metadata') {
      setMetadataPath('');
    } else {
      setMetadataPath('');
      if (onChange) {
        onChange(fieldPath);
      }
    }
  };

  const handleMetadataPathChange = (path: string) => {
    setMetadataPath(path);
    const fullPath = path ? `variant.metadata.${path}` : 'variant.metadata';
    setSelectedFieldPath(fullPath);
    if (onChange) {
      onChange(fullPath);
    }
  };

  if (!schema) {
    return null;
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: 'Field is required' }}
      render={({ field, fieldState }) => {
        // Use field.value as source of truth, but sync with local state
        const currentValue = field.value || selectedFieldPath;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel required>Field</FieldLabel>
            <div className="space-y-2">
              <Select
                value={
                  isMetadataField
                    ? 'variant.metadata'
                    : currentValue || selectedFieldPath
                }
                onValueChange={(val) => {
                  handleFieldChange(val);
                  field.onChange(val);
                  if (onChange) {
                    onChange(val);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(schema.rootObjects).map(
                    ([root, rootObject]) => (
                      <SelectGroup key={root}>
                        <SelectLabel>
                          {root.charAt(0).toUpperCase() + root.slice(1)}
                        </SelectLabel>
                        {rootObject.fields.map((fieldDef) => (
                          <SelectItem key={fieldDef.path} value={fieldDef.path}>
                            {fieldDef.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  )}
                </SelectContent>
              </Select>

              {isMetadataField && (
                <Input
                  placeholder="e.g., category, my-classifier.tags"
                  value={metadataPath}
                  onChange={(e) => {
                    const path = e.target.value;
                    handleMetadataPathChange(path);
                    const fullPath = path
                      ? `variant.metadata.${path}`
                      : 'variant.metadata';
                    field.onChange(fullPath);
                    if (onChange) {
                      onChange(fullPath);
                    }
                  }}
                />
              )}
            </div>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
