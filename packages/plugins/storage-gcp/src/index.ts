import { LongpointPluginConfig } from '@longpoint/devkit';
import { GCPStorageProvider } from './gcp.js';
import { manifest } from './manifest.js';

export default {
  displayName: 'Google Cloud Storage',
  icon: manifest.image,
  contributes: {
    storage: {
      gcp: {
        provider: GCPStorageProvider,
        displayName: manifest.displayName,
        configSchema: manifest.configSchema,
      },
    },
  },
} satisfies LongpointPluginConfig;
