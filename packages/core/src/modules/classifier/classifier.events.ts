import { JsonObject } from '@/shared/types/object.types';
import { EventPayload } from '../event/event.types';

export const ClassifierEventKey = {
  CLASSIFIER_RUN_COMPLETE: 'classifier.run.complete',
} as const;

export type ClassifierEventKey =
  (typeof ClassifierEventKey)[keyof typeof ClassifierEventKey];

export interface ClassifierRunCompleteEventPayload extends EventPayload {
  assetId: string;
  assetVariantId: string;
  classifierId: string;
  classifierName: string;
  result: JsonObject | null;
}

export interface ClassifierEventPayloads {
  [ClassifierEventKey.CLASSIFIER_RUN_COMPLETE]: ClassifierRunCompleteEventPayload;
}
