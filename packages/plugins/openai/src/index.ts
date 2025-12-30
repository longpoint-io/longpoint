import { llmClassifierInput, LongpointPluginConfig } from '@longpoint/devkit';
import { OpenAIClassifier } from './openai-classifier.js';
import { OpenAIPluginSettings, settings } from './settings.js';

export default {
  displayName: 'OpenAI',
  description: 'Provides OpenAI capabilities',
  icon: 'icon.png',
  contributes: {
    settings,
    classifiers: {
      'gpt-5-nano-2025-08-07': {
        classifier: OpenAIClassifier,
        displayName: 'GPT-5 Nano',
        description: 'The smallest and fastest model in the GPT-5 family',
        input: llmClassifierInput,
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
