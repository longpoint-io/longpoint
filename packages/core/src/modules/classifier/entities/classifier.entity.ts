import { ConfigSchemaService } from '@/modules/common/services';
import { ClassifierRegistryEntry } from '@/modules/plugin/services';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { ClassifyResult } from '@longpoint/devkit';
import { Classifier, ClassifyArgs } from '@longpoint/devkit/classifier';
import { parseBytes } from '@longpoint/utils/format';
import { ClassifierDto, ClassifierReferenceDto } from '../dtos';

export interface ClassifierEntityArgs {
  registryEntry: ClassifierRegistryEntry;
  providerInstance: Classifier<any>;
  configSchemaService: ConfigSchemaService;
}

export class ClassifierEntity {
  readonly id: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly maxFileSize?: number;
  readonly supportedMimeTypes: string[];
  private readonly registryEntry: ClassifierRegistryEntry;
  private readonly providerInstance: Classifier<any>;
  private readonly configSchemaService: ConfigSchemaService;

  constructor(args: ClassifierEntityArgs) {
    const { contribution, pluginId, classifierKey } = args.registryEntry;
    this.id = `${pluginId}/${classifierKey}`;
    this.displayName = contribution.displayName ?? classifierKey;
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
   * Checks if a mime type is supported by the classifier.
   */
  isMimeTypeSupported(mimeType: string): boolean {
    return this.supportedMimeTypes.includes(mimeType);
  }

  /**
   * Validates and processes the classifier input values.
   */
  async processInboundInput(input: ConfigValues = {}): Promise<ConfigValues> {
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

  toDto(): ClassifierDto {
    return new ClassifierDto({
      id: this.id,
      displayName: this.displayName,
      description: this.description,
      supportedMimeTypes: this.supportedMimeTypes,
      maxFileSize: this.maxFileSize,
      inputSchema: this.classifierInputSchema,
    });
  }

  toReferenceDto(): ClassifierReferenceDto {
    return new ClassifierReferenceDto({
      id: this.id,
      displayName: this.displayName,
    });
  }
}
