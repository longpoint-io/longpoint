import { ConfigSchemaService } from '@/modules/common/services';
import { ClassificationProviderRegistryEntry } from '@/modules/plugin/services';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { ClassifyResult } from '@longpoint/devkit';
import {
  ClassificationProvider,
  ClassifyArgs,
} from '@longpoint/devkit/classifier';
import { parseBytes } from '@longpoint/utils/format';
import {
  ClassificationProviderDto,
  ClassificationProviderSummaryDto,
} from '../dtos';

export interface ClassificationProviderEntityArgs {
  registryEntry: ClassificationProviderRegistryEntry;
  providerInstance: ClassificationProvider<any>;
  configSchemaService: ConfigSchemaService;
}

export class ClassificationProviderEntity {
  readonly id: string;
  readonly fullyQualifiedId: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly maxFileSize?: number;
  readonly supportedMimeTypes: string[];
  private readonly registryEntry: ClassificationProviderRegistryEntry;
  private readonly providerInstance: ClassificationProvider<any>;
  private readonly configSchemaService: ConfigSchemaService;

  constructor(args: ClassificationProviderEntityArgs) {
    const { contribution, fullyQualifiedId } = args.registryEntry;
    this.id = contribution.displayName ?? args.registryEntry.classifierId;
    this.fullyQualifiedId = fullyQualifiedId;
    this.displayName =
      contribution.displayName ?? args.registryEntry.classifierId;
    this.description = contribution.description ?? null;
    this.maxFileSize = contribution.maxFileSize
      ? parseBytes(contribution.maxFileSize)
      : undefined;
    this.supportedMimeTypes = contribution.supportedMimeTypes ?? [];
    this.registryEntry = args.registryEntry;
    this.providerInstance = args.providerInstance;
    this.configSchemaService = args.configSchemaService;
  }

  /**
   * Runs the classification on the provided source.
   */
  async classify(args: ClassifyArgs): Promise<ClassifyResult> {
    return this.providerInstance.classify(args);
  }

  /**
   * Checks if a mime type is supported by the classification provider.
   */
  isMimeTypeSupported(mimeType: string): boolean {
    return this.supportedMimeTypes.includes(mimeType);
  }

  /**
   * Validates and processes the classifier input values.
   */
  async processInboundClassifierInput(
    input: ConfigValues = {}
  ): Promise<ConfigValues> {
    const inputSchema = this.classifierInputSchema;
    if (!inputSchema || Object.keys(inputSchema).length === 0) {
      return input;
    }
    return await this.configSchemaService
      .get(inputSchema)
      .processInboundValues(input);
  }

  get classifierInputSchema(): ConfigSchemaDefinition {
    return this.registryEntry.contribution.input ?? {};
  }

  toDto(): ClassificationProviderDto {
    return new ClassificationProviderDto({
      id: this.registryEntry.classifierId,
      fullyQualifiedId: this.fullyQualifiedId,
      displayName: this.displayName,
      description: this.description,
      supportedMimeTypes: this.supportedMimeTypes,
      maxFileSize: this.maxFileSize,
      classifierInputSchema: this.classifierInputSchema,
      pluginId: this.registryEntry.pluginId,
    });
  }

  toSummaryDto(): ClassificationProviderSummaryDto {
    return new ClassificationProviderSummaryDto({
      id: this.registryEntry.classifierId,
      fullyQualifiedId: this.fullyQualifiedId,
      displayName: this.displayName,
      description: this.description,
      pluginId: this.registryEntry.pluginId,
    });
  }
}
