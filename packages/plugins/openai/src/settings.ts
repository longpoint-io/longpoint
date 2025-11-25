import { ConfigSchemaDefinition } from '@longpoint/config-schema';

export const settings = {
  apiKey: {
    label: 'API Key',
    type: 'secret',
    required: true,
    description:
      'Your OpenAI API key. You can find or create one at https://platform.openai.com/api-keys',
  },
} satisfies ConfigSchemaDefinition;

export type OpenAIPluginSettings = typeof settings;
