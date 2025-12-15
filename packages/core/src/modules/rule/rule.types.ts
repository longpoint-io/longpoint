import { AssetEventKey } from '../asset';

export const ComparisonOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  CONTAINS: 'contains',
  IN: 'in',
  NOT_IN: 'notIn',
  GREATER_THAN: 'greaterThan',
  LESS_THAN: 'lessThan',
} as const;
export type ComparisonOperator =
  (typeof ComparisonOperator)[keyof typeof ComparisonOperator];

export const LogicalOperator = {
  AND: 'and',
  OR: 'or',
} as const;
export type LogicalOperator =
  (typeof LogicalOperator)[keyof typeof LogicalOperator];

export interface SingleCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface CompoundCondition {
  operator: LogicalOperator;
  conditions: RuleCondition[];
}

export type RuleCondition = SingleCondition | CompoundCondition;

export interface RunClassifierAction {
  type: 'runClassifier';
  classifierTemplateId: string;
}

export interface RunTransformerAction {
  type: 'runTransformer';
  transformTemplateId?: string;
  transformTemplateName?: string;
  sourceVariantId: string;
}

export type RuleAction = RunClassifierAction | RunTransformerAction;

export const RuleTriggerEvent = {
  ASSET_VARIANT_READY: AssetEventKey.ASSET_VARIANT_READY,
} as const;

export type RuleTriggerEvent =
  (typeof RuleTriggerEvent)[keyof typeof RuleTriggerEvent];
