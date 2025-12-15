export const RuleEvents = {} as const;

export type RuleEvents = (typeof RuleEvents)[keyof typeof RuleEvents];

export interface RuleEventPayloads {
  // Empty for now - future rule execution events can be added here
}
