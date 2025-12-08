import { ConfigSchemaService } from '@/modules/common/services';
import { TransformerRegistryEntry } from '@/modules/plugin/services';
import { Serializable } from '@/shared/types/swagger.types';
import { ConfigValues } from '@longpoint/config-schema';
import { AssetTransformer } from '@longpoint/devkit';
import {
  TransformerDetailsDto,
  TransformerDto,
} from '../dtos/transformers/transformer.dto';

export interface TransformerEntityArgs {
  pluginSettings: ConfigValues;
  registryEntry: TransformerRegistryEntry;
  transformerInstance: AssetTransformer;
  configSchemaService: ConfigSchemaService;
}

export class TransformerEntity implements Serializable {
  readonly id: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly supportedMimeTypes: string[];
  private readonly pluginSettings: ConfigValues;
  private readonly registryEntry: TransformerRegistryEntry;
  private readonly transformerInstance: AssetTransformer;
  private readonly configSchemaService: ConfigSchemaService;

  constructor(args: TransformerEntityArgs) {
    const { transformerKey, fullyQualifiedId, contribution } =
      args.registryEntry;
    this.id = fullyQualifiedId;
    this.displayName = contribution.displayName ?? transformerKey;
    this.description = contribution.description ?? null;
    this.supportedMimeTypes = contribution.supportedMimeTypes ?? [];
    this.pluginSettings = args.pluginSettings;
    this.registryEntry = args.registryEntry;
    this.transformerInstance = args.transformerInstance;
    this.configSchemaService = args.configSchemaService;
  }

  /**
   * Validate and process transform template input values.
   * @param input
   * @returns The processed input values.
   */
  async processInput(input: ConfigValues): Promise<ConfigValues> {
    return this.configSchemaService
      .get(this.registryEntry.contribution.input ?? {})
      .processInboundValues(input);
  }

  /**
   * Validate and process transform template input values from database.
   * @param input
   * @returns The processed input values.
   */
  async processInputFromDb(input: ConfigValues): Promise<ConfigValues> {
    return this.configSchemaService
      .get(this.registryEntry.contribution.input ?? {})
      .processOutboundValues(input);
  }

  toDto(version?: 'default' | 'details'): TransformerDto {
    switch (version) {
      case 'details':
        return new TransformerDetailsDto({
          id: this.id,
          displayName: this.displayName,
          description: this.description,
          supportedMimeTypes: this.supportedMimeTypes,
          inputSchema: this.registryEntry.contribution.input ?? {},
        });
      case 'default':
      default:
        return new TransformerDto({
          id: this.id,
          displayName: this.displayName,
          description: this.description,
          supportedMimeTypes: this.supportedMimeTypes,
        });
    }
  }
}
