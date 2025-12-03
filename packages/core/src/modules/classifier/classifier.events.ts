import { JsonObject } from '@/shared/types/object.types';
import { EventPayload } from '../event/event.types';

export const ClassifierEvents = {
  CLASSIFIER_RUN_COMPLETE: 'classifier.run.complete',
} as const;

export type ClassifierEvents =
  (typeof ClassifierEvents)[keyof typeof ClassifierEvents];

export interface ClassifierRunCompleteEventPayload extends EventPayload {
  assetId: string;
  assetVariantId: string;
  classifierId: string;
  classifierName: string;
  result: JsonObject | null;
}

export interface ClassifierEventPayloads {
  [ClassifierEvents.CLASSIFIER_RUN_COMPLETE]: ClassifierRunCompleteEventPayload;
}
