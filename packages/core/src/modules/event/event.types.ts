import { JsonObject } from '@longpoint/types';
import { AssetEventPayloads } from '../asset';
import { ClassifierEventPayloads } from '../classifier';

// Base event payload type
export type EventPayload = JsonObject;

// Registered event payloads
export type PlatformEventPayloads = AssetEventPayloads &
  ClassifierEventPayloads;
export type EventKey = keyof PlatformEventPayloads;

export interface EventPublisher {
  publish<T extends EventKey>(
    event: T,
    payload: PlatformEventPayloads[T]
  ): Promise<void>;
}
