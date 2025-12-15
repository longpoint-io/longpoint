export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'notIn',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

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

export type RuleTriggerEvent = 'asset.variant.ready';
