import { ConfigSchemaService } from '@/modules/common/services';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { SearchProviderDto, SearchProviderReferenceDto } from '../dtos';

export interface BaseSearchProviderEntityArgs {
  id: string;
  displayName?: string;
  image?: string;
  supportsEmbedding?: boolean;
  providerConfigSchema?: ConfigSchemaDefinition;
  providerConfigValues: ConfigValues;
  indexConfigSchema?: ConfigSchemaDefinition;
  configSchemaService: ConfigSchemaService;
}

export class BaseSearchProviderEntity {
  readonly id: string;
  readonly displayName: string;
  readonly image?: string;
  readonly supportsEmbedding: boolean;
  readonly indexConfigSchema?: ConfigSchemaDefinition;
  private readonly providerConfigValues: ConfigValues;
  private readonly providerConfigSchema?: ConfigSchemaDefinition;
  private readonly configSchemaService: ConfigSchemaService;

  constructor(args: BaseSearchProviderEntityArgs) {
    this.id = args.id;
    this.displayName = args.displayName ?? this.id;
    this.image = args.image;
    this.supportsEmbedding = args.supportsEmbedding ?? false;
    this.providerConfigSchema = args.providerConfigSchema;
    this.providerConfigValues = args.providerConfigValues;
    this.configSchemaService = args.configSchemaService;
    this.indexConfigSchema = args.indexConfigSchema;
  }

  processConfigFromDb(configValues: ConfigValues): Promise<ConfigValues> {
    if (!this.providerConfigSchema) {
      return Promise.resolve(configValues);
    }
    return this.configSchemaService
      .get(this.providerConfigSchema)
      .processOutboundValues(configValues);
  }

  processIndexConfigFromDb(configValues: ConfigValues): Promise<ConfigValues> {
    if (!this.indexConfigSchema) {
      return Promise.resolve(configValues);
    }
    return this.configSchemaService
      .get(this.indexConfigSchema)
      .processOutboundValues(configValues);
  }

  toDto() {
    return new SearchProviderDto({
      id: this.id,
      name: this.displayName,
      image: this.image,
      supportsEmbedding: this.supportsEmbedding,
      config: this.providerConfigValues,
      configSchema: this.providerConfigSchema,
      indexConfigSchema: this.indexConfigSchema,
    });
  }

  toReferenceDto() {
    return new SearchProviderReferenceDto({
      id: this.id,
      name: this.displayName,
      image: this.image,
    });
  }

  get needsConfig(): boolean {
    const configSchema = this.providerConfigSchema;

    if (!configSchema) {
      return false;
    }

    const result = this.configSchemaService
      .get(configSchema)
      .validate(this.providerConfigValues);
    return !result.valid;
  }
}
