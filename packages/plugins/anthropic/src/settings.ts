import { ConfigSchemaDefinition } from '@longpoint/config-schema';

export const settings = {
  apiKey: {
    label: 'API Key',
    type: 'secret',
    required: true,
    description: 'Your Claude API key. You can find it in the Claude Console.',
  },
  classifierRetries: {
    label: 'Classifier retries',
    type: 'number',
    description:
      'The number of times to retry the classifier if it fails. This is useful if returned JSON is invalid, and needs to be re-attempted. Defaults to 3.',
  },
} satisfies ConfigSchemaDefinition;

export type AnthropicPluginSettings = typeof settings;
