import { components } from '@longpoint/sdk';
import * as z from 'zod';

type RuleCondition = NonNullable<
  components['schemas']['RuleDetails']['condition']
>;

const conditionSchema: z.ZodType<RuleCondition> = z.lazy(() =>
  z.discriminatedUnion('operator', [
    z.object({
      field: z.string().min(1, 'Field is required'),
      operator: z.enum([
        'equals',
        'notEquals',
        'contains',
        'in',
        'notIn',
        'greaterThan',
        'lessThan',
      ]),
      value: z.any(),
    }),
    z.object({
      operator: z.enum(['and', 'or']),
      conditions: z.array(conditionSchema as z.ZodType<RuleCondition>),
    }),
  ])
);

const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('runClassifier'),
    classifierTemplateId: z.string().min(1, 'Classifier template is required'),
  }),
  z.object({
    type: z.literal('runTransformer'),
    transformTemplateId: z.string().min(1, 'Transform template is required'),
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
