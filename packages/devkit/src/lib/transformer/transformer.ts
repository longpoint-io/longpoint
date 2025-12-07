import { ConfigValues } from '@longpoint/config-schema';
import { Readable } from 'stream';
import { AssetSource } from '../types/asset.js';

export interface FileOperations {
  write(path: string, readable: Readable): Promise<void>;
  read(path: string): Promise<Readable>;
  delete(path: string): Promise<void>;
}

export interface AssetTransformerArgs {
  pluginSettings: ConfigValues;
  fileOperations: FileOperations;
}

export interface TransformArgs<T extends ConfigValues = ConfigValues> {
  source: AssetSource;
  input: T;
}

export abstract class AssetTransformer {
  protected readonly pluginSettings: ConfigValues;
  protected readonly fileOperations: FileOperations;

  constructor(args: AssetTransformerArgs) {
    this.pluginSettings = args.pluginSettings;
    this.fileOperations = args.fileOperations;
  }

  abstract transform(args: TransformArgs): Promise<void>;
}
