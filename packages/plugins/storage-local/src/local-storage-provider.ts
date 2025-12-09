import {
  FileStats,
  GetFileStreamOptions,
  StorageProvider,
} from '@longpoint/devkit';
import fs from 'fs';
import { dirname, join } from 'path';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export class LocalStorageProvider extends StorageProvider {
  async upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    const dirPath = dirname(fullPath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    const writeStream = fs.createWriteStream(fullPath);
    await pipelineAsync(body, writeStream);

    return true;
  }

  async deleteDirectory(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    await fs.promises.rm(fullPath, { recursive: true, force: true });
  }

  async getFileStream(
    path: string,
    options?: GetFileStreamOptions
  ): Promise<Readable> {
    const fullPath = this.getFullPath(path);
    return fs.createReadStream(fullPath, {
      start: options?.start,
      end: options?.end,
    });
  }

  async exists(path: string): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(path: string): Promise<FileStats> {
    const fullPath = this.getFullPath(path);
    const stats = await fs.promises.stat(fullPath);

    if (stats.isDirectory()) {
      const totalSize = await this.calculateDirectorySize(fullPath);
      return {
        size: totalSize,
      };
    }

    return {
      size: stats.size,
    };
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullEntryPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        totalSize += await this.calculateDirectorySize(fullEntryPath);
      } else {
        const stats = await fs.promises.stat(fullEntryPath);
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Construct the full path for a file.
   * The path parameter should be in format: {prefix}/{storageUnitId}/{assetId}/...
   * We prepend LOCAL_STORAGE_ROOT to the full path.
   */
  private getFullPath(path: string): string {
    const localStorageRoot =
      process.env['LOCAL_STORAGE_ROOT'] ?? 'data/storage';
    return join(localStorageRoot, path);
  }
}
