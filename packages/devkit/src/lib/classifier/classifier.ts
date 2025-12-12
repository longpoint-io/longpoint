import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { AssetSource } from '../types/asset.js';
import { ClassifyResult } from './types.js';

export interface ClassifierArgs<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  pluginSettings: ConfigValues<T>;
  providerId: string;
}

export interface ClassifyArgs<T extends ConfigValues = ConfigValues> {
  source: AssetSource;
  classifierInput: T;
}

export abstract class Classifier<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  protected pluginSettings: ConfigValues<T>;
  protected providerId: string;

  constructor(args: ClassifierArgs<T>) {
    this.pluginSettings = args.pluginSettings;
    this.providerId = args.providerId;
  }

  abstract classify(args: ClassifyArgs): Promise<ClassifyResult>;
}
