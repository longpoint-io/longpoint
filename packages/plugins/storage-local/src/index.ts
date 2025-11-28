import { LongpointPluginConfig } from '@longpoint/devkit';
import { LocalStorageProvider } from './local-storage-provider.js';

export default {
  displayName: 'Local Storage',
  contributes: {
    storage: {
      local: {
        provider: LocalStorageProvider,
        displayName: 'Local Storage',
      },
    },
  },
} satisfies LongpointPluginConfig;
