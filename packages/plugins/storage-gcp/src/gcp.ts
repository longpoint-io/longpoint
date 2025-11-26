import { Storage } from '@google-cloud/storage';
import { StorageProvider, StorageProviderArgs } from '@longpoint/devkit';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export class GCPStorageProvider extends StorageProvider {
  private storage: Storage;
  private bucketName: string;

  constructor(args: StorageProviderArgs) {
    super(args);
    this.bucketName = this.providerConfig.bucket;

    const storageOptions: {
      projectId?: string;
      credentials?: object;
    } = {};

    if (this.providerConfig.projectId) {
      storageOptions.projectId = this.providerConfig.projectId;
    }

    try {
      storageOptions.credentials = JSON.parse(
        this.providerConfig.serviceAccountKey
      );
      if (!storageOptions.projectId && storageOptions.credentials) {
        const creds = storageOptions.credentials as { project_id?: string };
        if (creds.project_id) {
          storageOptions.projectId = creds.project_id;
        }
      }
    } catch (error) {
      throw new Error(
        'Invalid service account key JSON. Please provide a valid JSON string.'
      );
    }

    this.storage = new Storage(storageOptions);
  }

  async upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean> {
    const objectName = this.normalizeGCSKey(path);
    const file = this.storage.bucket(this.bucketName).file(objectName);

    const writeStream = file.createWriteStream();

    let readableStream: Readable;
    if (Buffer.isBuffer(body)) {
      readableStream = Readable.from(body);
    } else if (typeof body === 'string') {
      readableStream = Readable.from(Buffer.from(body, 'utf-8'));
    } else {
      readableStream = body;
    }

    await pipelineAsync(readableStream, writeStream);

    return true;
  }

  async getFileStream(path: string): Promise<Readable> {
    const objectName = this.normalizeGCSKey(path);
    const file = this.storage.bucket(this.bucketName).file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`Object not found: ${objectName}`);
    }

    return file.createReadStream();
  }

  async exists(path: string): Promise<boolean> {
    const objectName = this.normalizeGCSKey(path);
    const file = this.storage.bucket(this.bucketName).file(objectName);

    try {
      const [exists] = await file.exists();
      return exists;
    } catch (error: any) {
      if (error.code === 404 || error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const prefix = this.normalizeGCSKey(path);

    // If prefix is empty, we can't safely delete (would delete everything)
    // This shouldn't happen in normal operation, but handle it gracefully
    if (!prefix) {
      return;
    }

    // Ensure prefix ends with / for directory-like behavior
    // GCS doesn't have true directories, but prefix matching works like directories
    const directoryPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    const bucket = this.storage.bucket(this.bucketName);
    const filesToDelete: string[] = [];

    const [files] = await bucket.getFiles({ prefix: directoryPrefix });

    for (const file of files) {
      filesToDelete.push(file.name);
    }

    if (filesToDelete.length === 0) {
      return;
    }

    const batchSize = 1000; // GCS API limit
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      await Promise.all(
        batch.map((fileName) => bucket.file(fileName).delete())
      );
    }
  }

  /**
   * Normalize a path to a GCS object name.
   * The path parameter should be in format: {prefix}/{storageUnitId}/{containerId}/...
   * We normalize leading slashes and use the full path as the GCS object name.
   */
  private normalizeGCSKey(path: string): string {
    // Remove leading slashes for GCS object name format
    return path.replace(/^\/+/, '');
  }
}
