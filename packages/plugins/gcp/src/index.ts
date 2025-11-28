import { LongpointPluginConfig } from '@longpoint/devkit';
import { GoogleCloudStorageProvider } from './gcs-provider.js';

export default {
  displayName: 'Google Cloud Platform',
  description: 'Unlock Longpoint functionality through Google Cloud Platform',
  icon: 'icon.webp',
  contributes: {
    storage: {
      gcs: {
        provider: GoogleCloudStorageProvider,
        displayName: 'Google Cloud Storage',
        configSchema: {
          bucket: {
            label: 'Bucket',
            description: 'The GCS bucket name.',
            type: 'string',
            immutable: true,
            required: true,
          },
          projectId: {
            label: 'Project ID',
            description:
              'The GCP project ID. If not provided, it will be inferred from the service account key.',
            type: 'string',
            immutable: false,
            required: false,
          },
          serviceAccountKey: {
            label: 'Service Account Key',
            description: 'Service account JSON key as a string.',
            type: 'secret',
            immutable: false,
            required: true,
          },
        },
      },
    },
  },
} satisfies LongpointPluginConfig;
