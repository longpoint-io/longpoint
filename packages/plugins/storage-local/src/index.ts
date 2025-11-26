import { LongpointPluginConfig } from '@longpoint/devkit';
import { LocalStorageProvider } from './local.js';
import { manifest } from './manifest.js';

export default {
  displayName: 'Local Storage',
  contributes: {
    storage: {
      local: {
        provider: LocalStorageProvider,
        displayName: manifest.displayName,
        configSchema: manifest.configSchema,
      },
    },
  },
} satisfies LongpointPluginConfig;
