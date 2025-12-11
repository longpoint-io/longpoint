import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Readable } from 'stream';
import { FilePathStats, GetFileStreamOptions } from './types.js';

export interface StorageProviderArgs<
  T extends ConfigSchemaDefinition = ConfigSchemaDefinition
> {
  pluginSettings: ConfigValues<T>;
  providerConfig: ConfigValues;
  baseUrl: string;
}

export abstract class StorageProvider {
  protected readonly pluginSettings: ConfigValues;
  protected readonly providerConfig: ConfigValues;
  protected readonly baseUrl: string;

  constructor(args: StorageProviderArgs) {
    this.pluginSettings = args.pluginSettings;
    this.providerConfig = args.providerConfig;
    this.baseUrl = args.baseUrl;
  }

  abstract upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean>;
  abstract getFileStream(
    path: string,
    options: GetFileStreamOptions
  ): Promise<Readable>;
  abstract exists(path: string): Promise<boolean>;
  abstract deleteDirectory(path: string): Promise<void>;
  abstract getPathStats(path: string): Promise<FilePathStats>;

  /**
   * Helper method to consume the entire stream and return as Buffer.
   * Use this when you need the full file contents in memory.
   */
  async getFileContents(path: string): Promise<Buffer> {
    const stream = await this.getFileStream(path, {});
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return Buffer.from(result);
  }
}
