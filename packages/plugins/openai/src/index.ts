import { llmFieldCapture, LongpointPluginConfig } from '@longpoint/devkit';
import { OpenAIClassificationProvider } from './openai-classification-provider.js';
import { OpenAIPluginSettings, settings } from './settings.js';

export default {
  displayName: 'OpenAI',
  description: 'Provides OpenAI capabilities',
  icon: 'icon.png',
  contributes: {
    settings,
    classifiers: {
      'gpt-5-nano-2025-08-07': {
        provider: OpenAIClassificationProvider,
        displayName: 'GPT-5 Nano',
        description: 'The smallest and fastest model in the GPT-5 family',
        input: llmFieldCapture,
        maxFileSize: '50MB',
        supportedMimeTypes: [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
      },
    },
  },
} satisfies LongpointPluginConfig<OpenAIPluginSettings>;
