import { AiPluginManifest } from '@longpoint/devkit';

export const manifest = {
  displayName: 'OpenAI',
  image: 'icon.png',
  configSchema: {
    apiKey: {
      label: 'API Key',
      type: 'secret',
      required: true,
      description:
        'Your OpenAI API key. You can find or create one at https://platform.openai.com/api-keys',
    },
  },
  models: {
    'gpt-5-nano-2025-08-07': {
      id: 'gpt-5-nano-2025-08-07',
      name: 'GPT-5 Nano',
      description:
        'The smallest and fastest model in the GPT-5 family. Great for classification tasks.',
      supportedMimeTypes: [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      maxFileSize: '50MB',
      classifier: {
        input: {
          fieldCapture: {
            label: 'Fields to capture',
            type: 'array',
            required: true,
            minLength: 1,
            maxLength: 10,
            items: {
              type: 'object',
              properties: {
                name: {
                  label: 'Name',
                  type: 'string',
                  description: 'The name of the field to capture',
                  required: true,
                },
                instructions: {
                  label: 'Instructions',
                  type: 'string',
                  description: 'Instructions for filling the field',
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies AiPluginManifest;

export type OpenAIPluginManifest = typeof manifest;
