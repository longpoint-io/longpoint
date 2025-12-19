import { llmClassifierInput, LongpointPluginConfig } from '@longpoint/devkit';
import { ClaudeClassifier } from './claude-classifier.js';
import { AnthropicPluginSettings, settings } from './settings.js';

export default {
  displayName: 'Anthropic',
  description: 'Provides Anthropic capabilities',
  icon: 'https://www.gstatic.com/pantheon/images/aiplatform/model_garden/icons/icon-anthropic-v2.png',
  contributes: {
    settings,
    classifiers: {
      'claude-haiku-4-5-20251001': {
        classifier: ClaudeClassifier,
        displayName: 'Claude Haiku 4.5',
        description: 'Fastest for quick tasks',
        maxFileSize: '5MB',
        supportedMimeTypes: [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        input: llmClassifierInput,
      },
      'claude-sonnet-4-5-20250929': {
        classifier: ClaudeClassifier,
        displayName: 'Claude Sonnet 4.5',
        description: 'Smartest for everyday tasks',
        supportedMimeTypes: [
          'image/jpg',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        maxFileSize: '5MB',
        input: llmClassifierInput,
      },
    },
  },
} satisfies LongpointPluginConfig<AnthropicPluginSettings>;
