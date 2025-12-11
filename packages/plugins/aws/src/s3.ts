import {
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {
  FileStats,
  GetFileStreamOptions,
  StorageProvider,
  StorageProviderArgs,
} from '@longpoint/devkit';
import { Readable } from 'stream';

export class S3StorageProvider extends StorageProvider {
  private s3Client: S3Client;

  constructor(args: StorageProviderArgs) {
    super(args);
    const clientConfig: {
      region: string;
      credentials: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      endpoint?: string;
      forcePathStyle: boolean;
    } = {
      region: this.providerConfig.region,
      credentials: {
        accessKeyId: this.providerConfig.accessKeyId,
        secretAccessKey: this.providerConfig.secretAccessKey,
      },
      forcePathStyle: this.providerConfig.forcePathStyle ?? false,
    };

    // Only include endpoint if it's provided and not empty
    if (
      this.providerConfig.endpoint &&
      this.providerConfig.endpoint.trim() !== ''
    ) {
      clientConfig.endpoint = this.providerConfig.endpoint;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async upload(
    path: string,
    body: Readable | Buffer | string
  ): Promise<boolean> {
    const key = this.normalizeS3Key(path);

    // utility to handle chunking properly for streams
    if (body instanceof Readable) {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.providerConfig.bucket,
          Key: key,
          Body: body,
        },
      });

      await upload.done();
      return true;
    }

    const commandParams: PutObjectCommandInput = {
      Bucket: this.providerConfig.bucket,
      Key: key,
      Body: body,
    };

    // extract the content length from the request headers
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

  async getFileStream(
    path: string,
    options?: GetFileStreamOptions
  ): Promise<Readable> {
    const key = this.normalizeS3Key(path);

    const commandParams: GetObjectCommandInput = {
      Bucket: this.providerConfig.bucket,
      Key: key,
    };

    if (options?.start !== undefined || options?.end !== undefined) {
      if (options.start !== undefined && options.end !== undefined) {
        commandParams.Range = `bytes=${options.start}-${options.end}`;
      } else if (options.start !== undefined) {
        commandParams.Range = `bytes=${options.start}-`;
      } else if (options.end !== undefined) {
        commandParams.Range = `bytes=0-${options.end}`;
      }
    }

    const response = await this.s3Client.send(
      new GetObjectCommand(commandParams)
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

  async getPathStats(path: string): Promise<FileStats> {
    const key = this.normalizeS3Key(path);
    const isExplicitDirectory = path.endsWith('/');

    if (!isExplicitDirectory) {
      try {
        const response = await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.providerConfig.bucket,
            Key: key,
          })
        );
        const size = response.ContentLength ?? 0;
        return { size };
      } catch (error: any) {
        if (
          error.name !== 'NotFound' &&
          error.$metadata?.httpStatusCode !== 404
        ) {
          throw error;
        }
      }
    }

    return this.getDirectoryStats(key);
  }

  private async getDirectoryStats(prefix: string): Promise<FileStats> {
    const directoryPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    let totalSize = 0;
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
          totalSize += object.Size ?? 0;
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    return {
      size: totalSize,
    };
  }

  /**
   * Normalize a path to an S3 object key.
   * The path parameter should be in format: {prefix}/{storageUnitId}/{assetId}/...
   * We normalize leading slashes and use the full path as the S3 key.
   */
  private normalizeS3Key(path: string): string {
    // Remove leading slashes for S3 key format
    return path.replace(/^\/+/, '');
  }
}
