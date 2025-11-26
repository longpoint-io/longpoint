import { ConfigSchemaService } from '@/modules/common/services';
import { VectorProviderRegistryEntry } from '@/modules/plugin/services';
import { ConfigValues } from '@longpoint/config-schema';
import {
  EmbedAndUpsertDocument,
  SearchResult,
  VectorDocument,
  VectorProvider,
} from '@longpoint/devkit';
import { BaseVectorProviderEntity } from './base-vector-provider.entity';

export interface VectorProviderEntityArgs {
  registryEntry: VectorProviderRegistryEntry;
  plugin: VectorProvider;
  configSchemaService: ConfigSchemaService;
}

export class VectorProviderEntity extends BaseVectorProviderEntity {
  private readonly plugin: VectorProvider;

  constructor(args: VectorProviderEntityArgs) {
    const registryEntry = args.registryEntry;
    super({
      id: registryEntry.fullyQualifiedId,
      displayName:
        registryEntry.contribution.displayName ??
        registryEntry.pluginConfig.displayName ??
        registryEntry.vectorId,
      image: registryEntry.pluginConfig.icon,
      supportsEmbedding: registryEntry.contribution.supportsEmbedding ?? false,
      providerConfigSchema: registryEntry.pluginConfig.contributes?.settings,
      providerConfigValues: args.plugin.pluginSettings,
      indexConfigSchema: registryEntry.contribution.indexConfigSchema,
      configSchemaService: args.configSchemaService,
    });
    this.plugin = args.plugin;
  }

  upsert(
    documents: VectorDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    return this.plugin.upsert(documents, indexConfigValues);
  }

  embedAndUpsert(
    documents: EmbedAndUpsertDocument[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    return this.plugin.embedAndUpsert(documents, indexConfigValues);
  }

  delete(
    documentIds: string[],
    indexConfigValues: ConfigValues
  ): Promise<void> {
    return this.plugin.delete(documentIds, indexConfigValues);
  }

  search(
    queryVector: number[],
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    return this.plugin.search(queryVector, indexConfigValues);
  }

  embedAndSearch(
    queryText: string,
    indexConfigValues: ConfigValues
  ): Promise<SearchResult[]> {
    return this.plugin.embedAndSearch(queryText, indexConfigValues);
  }

  dropIndex(indexConfigValues: ConfigValues): Promise<void> {
    return this.plugin.dropIndex(indexConfigValues);
  }
}
