import { LongpointPluginConfig } from '@longpoint/devkit';
import { manifest } from './manifest.js';
import { S3StorageProvider } from './s3.js';

export default {
  displayName: 'S3 Compatible Storage',
  icon: manifest.image,
  contributes: {
    storage: {
      s3: {
        provider: S3StorageProvider,
        displayName: manifest.displayName,
        configSchema: manifest.configSchema,
      },
    },
  },
} satisfies LongpointPluginConfig;
