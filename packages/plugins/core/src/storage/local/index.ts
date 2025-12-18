import { StorageContribution } from '@longpoint/devkit';
import { LocalStorageProvider } from './local-storage-provider.js';

const localStorageContribution = {
  provider: LocalStorageProvider,
  displayName: 'Local Storage',
  description: 'Store files locally on the server.',
} satisfies StorageContribution;

export default localStorageContribution;
