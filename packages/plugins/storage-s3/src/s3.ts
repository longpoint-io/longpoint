import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { StorageProvider, StorageProviderArgs } from '@longpoint/devkit';
import { Readable } from 'stream';

export class S3StorageProvider extends StorageProvider {
  private s3Client: S3Client;

  constructor(args: StorageProviderArgs) {
    super(args);
    this.s3Client = new S3Client({
      region: this.providerConfig.region,
      credentials: {
        accessKeyId: this.providerConfig.accessKeyId,
        secretAccessKey: this.providerConfig.secretAccessKey,
      },
      endpoint: this.providerConfig.endpoint,
      forcePathStyle: this.providerConfig.forcePathStyle ?? false,
    });
  }

  async upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean> {
    const key = this.normalizeS3Key(path);

    const commandParams: PutObjectCommandInput = {
      Bucket: this.providerConfig.bucket,
      Key: key,
      Body: body,
    };

    // Try to extract the content length from the request headers
    if (body && typeof body === 'object' && 'headers' in body) {
      const req = body as any;
      const contentLength = req.headers?.['content-length'];
      if (contentLength) {
        commandParams.ContentLength = parseInt(contentLength, 10);
      }
    }

    await this.s3Client.send(new PutObjectCommand(commandParams));

    return true;
  }

  async getFileStream(path: string): Promise<Readable> {
    const key = this.normalizeS3Key(path);

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.providerConfig.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error(`Object not found: ${key}`);
    }

    return response.Body as Readable;
  }

  async exists(path: string): Promise<boolean> {
    const key = this.normalizeS3Key(path);

    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.providerConfig.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const prefix = this.normalizeS3Key(path);

    // If prefix is empty, we can't safely delete (would delete everything)
    // This shouldn't happen in normal operation, but handle it gracefully
    if (!prefix) {
      return;
    }

    // Ensure prefix ends with / for directory-like behavior
    // S3 doesn't have true directories, but prefix matching works like directories
    const directoryPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    const objectsToDelete: { Key: string }[] = [];
    let continuationToken: string | undefined;

    do {
      const listResponse = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.providerConfig.bucket,
          Prefix: directoryPrefix,
          ContinuationToken: continuationToken,
        })
      );

      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          if (object.Key) {
            objectsToDelete.push({ Key: object.Key });
          }
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    if (objectsToDelete.length === 0) {
      return;
    }

    // S3 allows up to 1000 objects per delete request
    const batchSize = 1000;
    for (let i = 0; i < objectsToDelete.length; i += batchSize) {
      const batch = objectsToDelete.slice(i, i + batchSize);
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.providerConfig.bucket,
          Delete: {
            Objects: batch,
          },
        })
      );
    }
  }

  /**
   * Normalize a path to an S3 object key.
   * The path parameter should be in format: {prefix}/{storageUnitId}/{containerId}/...
   * We normalize leading slashes and use the full path as the S3 key.
   */
  private normalizeS3Key(path: string): string {
    // Remove leading slashes for S3 key format
    return path.replace(/^\/+/, '');
  }
}
