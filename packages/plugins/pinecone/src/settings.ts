import { ConfigSchemaDefinition } from '@longpoint/config-schema';

export const settings = {
  apiKey: {
    label: 'API Key',
    type: 'secret',
    required: true,
  },
} satisfies ConfigSchemaDefinition;

export type PineconePluginSettings = typeof settings;
