import {
  getFieldDefinition,
  type ComparisonOperator,
} from '@/pages/dashboard/rules/rule-field-schema';
import { Button } from '@longpoint/ui/components/button';
import { Card, CardContent, CardHeader } from '@longpoint/ui/components/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@longpoint/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@longpoint/ui/components/select';
import { PlusIcon, X } from 'lucide-react';
import { Control, Controller } from 'react-hook-form';
import { FieldPathSelector } from './rule-field-path-selector';
import { RuleFormData } from './rule-schema';
import { ValueInput } from './rule-value-input';

type LogicalOperator = 'and' | 'or';

type SingleCondition = {
  id?: string;
  field: string;
  operator: ComparisonOperator;
  value: unknown;
};

type CompoundCondition = {
  operator: LogicalOperator;
  conditions: SingleCondition[];
};

interface RuleConditionBuilderProps {
  control: Control<RuleFormData>;
  name: string;
  triggerEvent: string;
}

const LOGICAL_OPERATORS: { value: LogicalOperator; label: string }[] = [
  { value: 'and', label: 'And' },
  { value: 'or', label: 'Or' },
];

const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  equals: '=',
  notEquals: '≠',
  contains: 'Contains',
  in: 'In',
  notIn: 'Not In',
  greaterThan: '>',
  lessThan: '<',
};

function SingleConditionRow({
  control,
  name,
  triggerEvent,
  value,
  onChange,
  canRemove,
  onRemove,
}: {
  control: Control<RuleFormData>;
  name: any;
  triggerEvent: string;
  value?: SingleCondition;
  onChange: (value: SingleCondition) => void;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const operator = value?.operator || 'equals';
  const fieldPath = value?.field || '';

  const fieldDef = getFieldDefinition(triggerEvent, fieldPath);
  const availableOperators = fieldDef?.operators || [
    'equals',
    'notEquals',
    'contains',
    'in',
    'notIn',
    'greaterThan',
    'lessThan',
  ];

  return (
    <FieldGroup className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr] gap-4 not-first:border-t not-first:pt-4">
      <Field>
        <FieldPathSelector
          control={control}
          name={`${name}.field`}
          triggerEvent={triggerEvent}
          value={fieldPath}
          onChange={(newPath) => {
            const newFieldDef = getFieldDefinition(triggerEvent, newPath);
            const newOperators = newFieldDef?.operators || availableOperators;
            const newOperator = newOperators.includes(operator)
              ? operator
              : newOperators[0] || 'equals';

            onChange({
              ...value,
              field: newPath,
              operator: newOperator as ComparisonOperator,
              value: '',
            });
          }}
        />
      </Field>
      <Field>
        <Controller
          name={`${name}.operator` as any}
          control={control}
          rules={{ required: 'Operator is required' }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel required>Operator</FieldLabel>
              <Select
                value={(field.value as string) || 'equals'}
                onValueChange={(val) => {
                  field.onChange(val);
                  const newOperator = val as ComparisonOperator;
                  const needsArrayValue =
                    newOperator === 'in' || newOperator === 'notIn';
                  onChange({
                    field: value?.field || '',
                    operator: newOperator,
                    value: needsArrayValue ? [] : '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op} value={op}>
                      {OPERATOR_LABELS[op as ComparisonOperator]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </Field>
      <Field>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <ValueInput
              control={control}
              name={`${name}.value`}
              triggerEvent={triggerEvent}
              fieldPath={fieldPath}
              operator={operator}
              value={value?.value}
              onChange={(newValue) => {
                onChange({
                  field: value?.field || '',
                  operator: value?.operator || 'equals',
                  value: newValue,
                });
              }}
            />
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="mt-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Field>
    </FieldGroup>
  );
}

export function RuleConditionBuilder({
  control,
  name,
  triggerEvent,
}: RuleConditionBuilderProps) {
  return (
    <Controller
      name={name as any}
      control={control}
      render={({ field, fieldState }) => {
        const value = field.value as CompoundCondition | undefined | null;
        const isCompound = value && 'conditions' in value;
        const logicalOperator = isCompound ? value.operator : 'and';
        const currentConditions = isCompound ? value.conditions : [];

        // Ensure all conditions have IDs for stable keys
        // Generate IDs for conditions that don't have them (for backward compatibility)
        const conditionsToRender = currentConditions.map(
          (condition, index) => ({
            ...condition,
            id:
              condition.id ||
              `condition-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
          })
        );

        const handleLogicalOperatorChange = (op: LogicalOperator) => {
          if (!isCompound || currentConditions.length === 0) {
            // Initialize or update operator with empty conditions
            field.onChange({
              operator: op,
              conditions: [],
            });
          } else {
            field.onChange({
              ...value,
              operator: op,
            });
          }
        };

        const handleAddCondition = () => {
          const newCondition: SingleCondition = {
            id: `condition-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            field: '',
            operator: 'equals',
            value: '',
          };

          if (!isCompound) {
            // Initialize as compound condition
            field.onChange({
              operator: logicalOperator,
              conditions: [newCondition],
            });
          } else {
            const updatedConditions = [...currentConditions, newCondition];
            field.onChange({
              operator: logicalOperator,
              conditions: updatedConditions,
            });
          }
        };

        const handleRemoveCondition = (id: string) => {
          if (conditionsToRender.length === 1) {
            // Remove last condition, set to undefined
            field.onChange(undefined);
          } else {
            const updatedConditions = conditionsToRender.filter(
              (condition) => condition.id !== id
            );
            field.onChange({
              operator: logicalOperator,
              conditions: updatedConditions,
            });
          }
        };

        const handleConditionChange = (
          index: number,
          newValue: SingleCondition
        ) => {
          const updatedConditions = [...conditionsToRender];
          // Preserve the ID when updating, or generate one if missing
          const existingCondition = updatedConditions[index];
          const conditionId =
            existingCondition?.id ||
            newValue.id ||
            `condition-${Date.now()}-${index}-${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          updatedConditions[index] = {
            ...newValue,
            id: conditionId,
          };
          field.onChange({
            operator: logicalOperator,
            conditions: updatedConditions,
          });
        };

        return (
          <Card>
            {conditionsToRender.length >= 2 && (
              <CardHeader>
                <Select
                  value={logicalOperator}
                  onValueChange={handleLogicalOperatorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a logical operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGICAL_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
            )}
            <CardContent className="space-y-6">
              {conditionsToRender.map((condition, index) => (
                <SingleConditionRow
                  key={condition.id}
                  control={control}
                  name={`${name}.conditions.${index}` as any}
                  triggerEvent={triggerEvent}
                  value={condition}
                  onChange={(newValue) =>
                    handleConditionChange(index, newValue)
                  }
                  canRemove={true}
                  onRemove={() => handleRemoveCondition(condition.id!)}
                />
              ))}
              {conditionsToRender.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Since no conditions are added, this rule will run every time
                  the trigger occurs.
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCondition}
              >
                <PlusIcon />
                Add Condition
              </Button>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </CardContent>
          </Card>
        );
      }}
    />
  );
}
