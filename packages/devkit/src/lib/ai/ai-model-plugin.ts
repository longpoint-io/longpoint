import { JsonObject } from '@longpoint/types';
import { Classify } from './ai-capabilities.js';
import { AiModelManifest } from './ai-manifest.js';

export abstract class AiModelPlugin implements Classify {
  constructor(readonly manifest: AiModelManifest) {}

  async classify(args: any): Promise<JsonObject> {
    throw new Error(`Classify is not implemented for ${this.manifest.id}`);
  }
}
