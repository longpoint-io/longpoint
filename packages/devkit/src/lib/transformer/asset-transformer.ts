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
}

export interface HandshakeArgs<T extends ConfigValues = ConfigValues> {
  source: AssetSource;
  input: T;
}

export interface HandshakeResult {
  variants: Array<{
    name?: string;
    mimeType: string;
    entryPoint: string;
    type: 'DERIVATIVE' | 'THUMBNAIL';
  }>;
}

export interface TransformArgs<T extends ConfigValues = ConfigValues>
  extends HandshakeArgs<T> {
  variants: Array<{
    id: string;
    mimeType: string;
    entryPoint: string;
    fileOperations: FileOperations;
  }>;
}

export interface TransformResult {
  variants: Array<{
    id: string;
    error?: string;
  }>;
}

export abstract class AssetTransformer {
  protected readonly pluginSettings: ConfigValues;

  constructor(args: AssetTransformerArgs) {
    this.pluginSettings = args.pluginSettings;
  }

  abstract handshake(args: HandshakeArgs): Promise<HandshakeResult>;
  abstract transform(args: TransformArgs): Promise<TransformResult>;
}
