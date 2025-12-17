import { ConfigSchemaService } from '@/modules/common/services';
import { SearchProviderRegistryEntry } from '@/modules/plugin/services';
import { ConfigValues } from '@longpoint/config-schema';
import {
  EmbedAndUpsertDocument,
  SearchProvider,
  SearchResult,
  VectorDocument,
} from '@longpoint/devkit';
import { BaseSearchProviderEntity } from './base-search-provider.entity';

export interface SearchProviderEntityArgs {
  registryEntry: SearchProviderRegistryEntry;
  plugin: SearchProvider;
  configSchemaService: ConfigSchemaService;
}

export class SearchProviderEntity extends BaseSearchProviderEntity {
  private readonly plugin: SearchProvider;

  constructor(args: SearchProviderEntityArgs) {
    const registryEntry = args.registryEntry;
    super({
      id: registryEntry.fullyQualifiedId,
      displayName:
        registryEntry.contribution.displayName ??
        registryEntry.pluginConfig.displayName ??
        registryEntry.searchProviderKey,
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
