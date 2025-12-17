import { components } from '@longpoint/sdk';
import { ComparisonOperator, LogicalOperator } from '@longpoint/types';
import * as z from 'zod';

type RuleCondition = NonNullable<
  components['schemas']['RuleDetails']['condition']
>;

const conditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.discriminatedUnion('operator', [
    z.object({
      field: z.string().min(1, 'Field is required'),
      operator: z.enum([
        ComparisonOperator.EQUALS,
        ComparisonOperator.NOT_EQUALS,
        ComparisonOperator.IN,
        ComparisonOperator.NOT_IN,
        ComparisonOperator.GREATER_THAN,
        ComparisonOperator.LESS_THAN,
        ComparisonOperator.GREATER_THAN_OR_EQUAL_TO,
        ComparisonOperator.LESS_THAN_OR_EQUAL_TO,
        ComparisonOperator.STARTS_WITH,
        ComparisonOperator.ENDS_WITH,
      ]),
      value: z.any(),
    }),
    z.object({
      operator: z.enum([LogicalOperator.AND, LogicalOperator.OR]),
      conditions: z.array(conditionSchema as z.ZodType<RuleCondition>),
    }),
  ])
);

type RuleAction = components['schemas']['RuleDetails']['actions'][number];

const actionSchema: z.ZodType<RuleAction> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('RUN_CLASSIFIER'),
    classifierTemplateId: z.string().min(1, 'Classifier template is required'),
  }),
  z.object({
    type: z.literal('RUN_TRANSFORMER'),
    transformerTemplateId: z
      .string()
      .min(1, 'Transformer template is required'),
    sourceVariantId: z.string().min(1, 'Source variant ID is required'),
  }),
]);

export const ruleFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  enabled: z.boolean().default(true),
  triggerEvent: z.enum(['asset.variant.ready']),
  condition: conditionSchema.optional(),
  actions: z.array(actionSchema).min(1, 'At least one action is required'),
});

export type RuleFormData = z.infer<typeof ruleFormSchema>;
