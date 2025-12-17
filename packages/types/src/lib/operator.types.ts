export const ComparisonOperator = {
  EQUALS: 'EQUALS',
  GREATER_THAN: 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL_TO: 'GREATER_THAN_OR_EQUAL_TO',
  IN: 'IN',
  LESS_THAN: 'LESS_THAN',
  LESS_THAN_OR_EQUAL_TO: 'LESS_THAN_OR_EQUAL_TO',
  NOT_EQUALS: 'NOT_EQUALS',
  NOT_IN: 'NOT_IN',
  STARTS_WITH: 'STARTS_WITH',
  ENDS_WITH: 'ENDS_WITH',
} as const;
export type ComparisonOperator =
  (typeof ComparisonOperator)[keyof typeof ComparisonOperator];

export const LogicalOperator = {
  AND: 'AND',
  OR: 'OR',
} as const;
export type LogicalOperator =
  (typeof LogicalOperator)[keyof typeof LogicalOperator];

export type Operator = ComparisonOperator | LogicalOperator;

// ------------------------------------------------------------
// Operator sets
// ------------------------------------------------------------
export const NumericOperators = [
  ComparisonOperator.EQUALS,
  ComparisonOperator.NOT_EQUALS,
  ComparisonOperator.GREATER_THAN,
  ComparisonOperator.LESS_THAN,
  ComparisonOperator.GREATER_THAN_OR_EQUAL_TO,
  ComparisonOperator.LESS_THAN_OR_EQUAL_TO,
];

export type NumericOperator = (typeof NumericOperators)[number];

export const StringOperators = [
  ComparisonOperator.EQUALS,
  ComparisonOperator.NOT_EQUALS,
  ComparisonOperator.IN,
  ComparisonOperator.NOT_IN,
  ComparisonOperator.STARTS_WITH,
  ComparisonOperator.ENDS_WITH,
];

export type StringOperator = (typeof StringOperators)[number];
