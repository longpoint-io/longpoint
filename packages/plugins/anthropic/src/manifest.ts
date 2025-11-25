import { AiPluginManifest } from '@longpoint/devkit';

export const manifest = {
  displayName: 'Anthropic',
  image:
    'https://www.gstatic.com/pantheon/images/aiplatform/model_garden/icons/icon-anthropic-v2.png',
  configSchema: {
    apiKey: {
      label: 'API Key',
      type: 'secret',
      required: true,
      description:
        'Your Claude API key. You can find it in the Claude Console.',
    },
  },
  models: {
    'claude-haiku-4-5-20251001': {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      description: 'Fastest for quick tasks',
      maxFileSize: '5MB',
      supportedMimeTypes: [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
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
    'claude-sonnet-4-5-20250929': {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Smartest for everyday tasks',
      supportedMimeTypes: [
        'image/jpg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
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

export type AnthropicPluginManifest = typeof manifest;
