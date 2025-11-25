import { ConfigSchemaDefinition } from '@longpoint/config-schema';

export const settings = {
  apiKey: {
    label: 'API Key',
    type: 'secret',
    required: true,
    description: 'Your Claude API key. You can find it in the Claude Console.',
  },
} satisfies ConfigSchemaDefinition;

export type AnthropicPluginSettings = typeof settings;
