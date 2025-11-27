import { LongpointPluginConfig } from '@longpoint/devkit';
import { S3StorageProvider } from './s3.js';

export default {
  displayName: 'Amazon Web Services',
  description: 'AWS integrations',
  icon: 'icon.png',
  contributes: {
    storage: {
      s3: {
        provider: S3StorageProvider,
        displayName: 'Amazon S3',
        configSchema: {
          bucket: {
            label: 'Bucket',
            description: 'The S3 bucket name.',
            type: 'string',
            immutable: true,
            required: true,
          },
          region: {
            label: 'Region',
            description: 'The AWS region where the bucket is located.',
            type: 'string',
            immutable: true,
            required: true,
          },
          accessKeyId: {
            label: 'Access Key ID',
            description: 'AWS access key ID for authentication.',
            type: 'secret',
            immutable: false,
            required: true,
          },
          secretAccessKey: {
            label: 'Secret Access Key',
            description: 'AWS secret access key for authentication.',
            type: 'secret',
            immutable: false,
            required: true,
          },
          endpoint: {
            label: 'Endpoint',
            description:
              'Custom endpoint URL for S3-compatible storage services (e.g., MinIO, DigitalOcean Spaces). Leave empty for AWS S3.',
            type: 'string',
            immutable: false,
            required: false,
          },
          forcePathStyle: {
            label: 'Force Path Style',
            description:
              'Use path-style addressing instead of virtual-hosted-style. Required for some S3-compatible services.',
            type: 'boolean',
            immutable: false,
            required: false,
          },
        },
      },
    },
  },
} satisfies LongpointPluginConfig;
