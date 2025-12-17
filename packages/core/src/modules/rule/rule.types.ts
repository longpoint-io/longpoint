import type { ComparisonOperator, LogicalOperator } from '@longpoint/types';
import { AssetEventKey } from '../asset';

// ------------------------------------------------------------
// Conditions
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------

export const RuleActionType = {
  RUN_CLASSIFIER: 'RUN_CLASSIFIER',
  RUN_TRANSFORMER: 'RUN_TRANSFORMER',
} as const;
export type RuleActionType =
  (typeof RuleActionType)[keyof typeof RuleActionType];

export interface RunClassifierAction {
  type: typeof RuleActionType.RUN_CLASSIFIER;
  classifierTemplateId: string;
}

export interface RunTransformerAction {
  type: typeof RuleActionType.RUN_TRANSFORMER;
  transformTemplateId: string;
  sourceVariantId: string;
}

export type RuleAction = RunClassifierAction | RunTransformerAction;

// ------------------------------------------------------------
// Events
// ------------------------------------------------------------

export const RuleTriggerEvent = {
  ASSET_VARIANT_READY: AssetEventKey.ASSET_VARIANT_READY,
} as const;

export type RuleTriggerEvent =
  (typeof RuleTriggerEvent)[keyof typeof RuleTriggerEvent];
