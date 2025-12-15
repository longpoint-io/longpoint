import { JsonObject } from '@longpoint/types';
import { AssetEventPayloads } from '../asset';
import { ClassifierEventPayloads } from '../classifier';
import { RuleEventPayloads } from '../rule';

// Base event payload type
export type EventPayload = JsonObject;

// Registered event payloads
export type EventPayloads = AssetEventPayloads &
  ClassifierEventPayloads &
  RuleEventPayloads;
export type Events = keyof EventPayloads;

export interface EventPublisher {
  publish<T extends Events>(event: T, payload: EventPayloads[T]): Promise<void>;
}
