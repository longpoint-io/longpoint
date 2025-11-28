import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { JsonObject } from '@longpoint/types';
import { AssetSource } from '../types/asset.js';

export interface ClassificationProviderArgs<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  pluginSettings: ConfigValues<T>;
  providerId: string;
}

export interface ClassifyArgs<T extends ConfigValues = ConfigValues> {
  source: AssetSource;
  classifierInput: T;
}

export abstract class ClassificationProvider<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  protected pluginSettings: ConfigValues<T>;
  protected providerId: string;

  constructor(args: ClassificationProviderArgs<T>) {
    this.pluginSettings = args.pluginSettings;
    this.providerId = args.providerId;
  }

  abstract classify(args: ClassifyArgs): Promise<JsonObject>;
}
