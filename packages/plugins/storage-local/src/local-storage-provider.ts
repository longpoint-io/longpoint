import { StorageProvider } from '@longpoint/devkit';
import fs from 'fs';
import { dirname, join } from 'path';
import { Readable } from 'stream';

export class LocalStorageProvider extends StorageProvider {
  async upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean> {
    const fullPath = this.getFullPath(path);
    const dirPath = dirname(fullPath);
    await fs.promises.mkdir(dirPath, { recursive: true });
    await fs.promises.writeFile(fullPath, body);
    return true;
  }

  async deleteDirectory(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    await fs.promises.rm(fullPath, { recursive: true, force: true });
  }

  async getFileStream(path: string): Promise<Readable> {
    const fullPath = this.getFullPath(path);
    return fs.createReadStream(fullPath);
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
