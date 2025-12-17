import { JsonObject } from '@/shared/types/object.types';
import { EventPayload } from '../event/event.types';

export const enum ClassifierEventKey {
  CLASSIFIER_RUN_COMPLETE = 'classifier.run.complete',
}

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
