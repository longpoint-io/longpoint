import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import { Input } from '@longpoint/ui/components/input';
import { Item, ItemActions, ItemContent } from '@longpoint/ui/components/item';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { Switch } from '@longpoint/ui/components/switch';
import { Control, Controller } from 'react-hook-form';
import { RuleFormData } from './rule-schema';

interface RuleBasicFieldsProps {
  control: Control<RuleFormData>;
}

export function RuleBasicFields({ control }: RuleBasicFieldsProps) {
  return (
    <FieldGroup>
      <Controller
        name="displayName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="max-w-xs">
            <FieldLabel htmlFor="rule-display-name" required>
              Name
            </FieldLabel>
            <Input
              {...field}
              id="rule-display-name"
              placeholder="Classify on Upload"
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="triggerEvent"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="max-w-xs">
            <FieldLabel htmlFor="trigger-event" required>
              Trigger
            </FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="trigger-event">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asset.variant.ready">
                  Asset Variant Ready
                </SelectItem>
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="enabled"
        control={control}
        render={({ field }) => (
          <Field>
            <Item variant="outline">
              <ItemContent>
                <FieldLabel htmlFor="enabled">Enabled</FieldLabel>
                <FieldDescription>Whether this rule is active</FieldDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  id="enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </ItemActions>
            </Item>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
