import { LongpointPluginConfig } from '@longpoint/devkit';
import { PineconeSearchProvider } from './pinecone.js';
import { PineconePluginSettings, settings } from './settings.js';

export default {
  displayName: 'Pinecone',
  description:
    'The purpose-built vector database delivering relevant results at any scale',
  icon: 'icon.png',
  contributes: {
    settings,
    search: {
      pinecone: {
        provider: PineconeSearchProvider,
        displayName: 'Pinecone',
        description:
          'The purpose-built vector database delivering relevant results at any scale',
        supportsEmbedding: true,
        indexConfigSchema: {
          name: {
            label: 'Pinecone Index Name',
            type: 'string',
            required: true,
            immutable: true,
            placeholder: 'longpoint',
            description: 'The index name as it appears in Pinecone',
          },
        },
      },
    },
  },
} satisfies LongpointPluginConfig<PineconePluginSettings>;
