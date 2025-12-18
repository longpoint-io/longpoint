import { ConfigSchemaService } from '@/modules/common/services';
import { ConfigValues } from '@longpoint/config-schema';
import { StoragePluginManifest } from '@longpoint/devkit';
import {
  StorageProviderDetailsDto,
  StorageProviderDto,
  StorageProviderReferenceDto,
} from '../dtos';

export interface BaseStorageProviderEntityArgs
  extends Pick<
    StoragePluginManifest,
    'displayName' | 'image' | 'configSchema'
  > {
  id: string;
  configSchemaService: ConfigSchemaService;
}

/**
 * A discovery-friendly base class for storage provider entities.
 */
export class BaseStorageProviderEntity {
  readonly id: string;
  readonly displayName: string;
  readonly image?: string;
  private readonly configSchema: StoragePluginManifest['configSchema'];
  private readonly configSchemaService: ConfigSchemaService;

  constructor(args: BaseStorageProviderEntityArgs) {
    this.id = args.id;
    this.displayName = args.displayName ?? this.id;
    this.image = args.image;
    this.configSchema = args.configSchema;
    this.configSchemaService = args.configSchemaService;
  }

  processConfig(configValues: ConfigValues): Promise<ConfigValues> {
    return this.configSchemaService
      .get(this.configSchema)
      .processInboundValues(configValues);
  }

  processConfigFromDb(configValues: ConfigValues): Promise<ConfigValues> {
    return this.configSchemaService
      .get(this.configSchema)
      .processOutboundValues(configValues);
  }

  toReferenceDto() {
    return new StorageProviderReferenceDto({
      id: this.id,
      name: this.displayName,
    });
  }

  toDto() {
    return new StorageProviderDto({
      id: this.id,
      name: this.displayName,
      image: this.image,
    });
  }

  toDetailsDto() {
    return new StorageProviderDetailsDto({
      id: this.id,
      name: this.displayName,
      image: this.image,
      configSchema: this.configSchema,
    });
  }
}
