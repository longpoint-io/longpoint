import { ConfigSchemaService } from '@/modules/common/services';
import { PluginRegistryService } from '@/modules/plugin/services';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { ClassifierArgs } from '@longpoint/devkit/classifier';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { ClassifierNotFound } from '../classifier.errors';
import { ClassifierEntity } from '../entities/classifier.entity';

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private readonly providerEntityCache = new Map<string, ClassifierEntity>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly pluginRegistryService: PluginRegistryService
  ) {}

  /**
   * List all installed classifiers.
   * @returns A list of classifier entities.
   */
  async listClassifiers(): Promise<ClassifierEntity[]> {
    const registryEntries = this.pluginRegistryService.listClassifiers();
    const providers: ClassifierEntity[] = [];

    for (const registryEntry of registryEntries) {
      const provider = await this.getProviderEntity(
        registryEntry.fullyQualifiedId
      );
      if (provider) {
        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get a classifier by its fully qualified ID.
   * @param fullyQualifiedId - The fully qualified ID of the classifier (e.g., 'openai/gpt-5-nano-2025-08-07').
   * @returns The classifier entity, or `null` if not found.
   */
  async getClassifierById(
    fullyQualifiedId: string
  ): Promise<ClassifierEntity | null> {
    return this.getProviderEntity(fullyQualifiedId);
  }

  /**
   * Get a classifier by its fully qualified ID and throw an error if it is not found.
   * @param fullyQualifiedId - The fully qualified ID of the classifier.
   * @returns The classifier entity.
   * @throws {ClassifierNotFound} If the classifier is not found.
   */
  async getClassifierByIdOrThrow(
    fullyQualifiedId: string
  ): Promise<ClassifierEntity> {
    const provider = await this.getClassifierById(fullyQualifiedId);
    if (!provider) {
      throw new ClassifierNotFound(fullyQualifiedId);
    }
    return provider;
  }

  /**
   * Get or create a classifier entity, loading config lazily.
   */
  private async getProviderEntity(
    fullyQualifiedId: string
  ): Promise<ClassifierEntity | null> {
    const cached = this.providerEntityCache.get(fullyQualifiedId);
    if (cached) {
      return cached;
    }

    const registryEntry =
      this.pluginRegistryService.getClassifierById(fullyQualifiedId);
    if (!registryEntry) {
      return null;
    }

    const pluginSettings = await this.getPluginSettingsFromDb(
      registryEntry.pluginId,
      registryEntry.pluginConfig.contributes?.settings
    );

    const providerInstance = new registryEntry.contribution.classifier({
      pluginSettings: pluginSettings ?? {},
      providerId: registryEntry.classifierKey,
    } as ClassifierArgs<any>);

    const entity = new ClassifierEntity({
      registryEntry,
      providerInstance,
      configSchemaService: this.configSchemaService,
    });

    this.providerEntityCache.set(fullyQualifiedId, entity);
    return entity;
  }

  private async getPluginSettingsFromDb(
    pluginId: string,
    schemaObj?: ConfigSchemaDefinition
  ): Promise<ConfigValues> {
    const pluginSettings = await this.prismaService.pluginSettings.findUnique({
      where: {
        pluginId,
      },
    });

    if (!pluginSettings) {
      return {};
    }

    try {
      return await this.configSchemaService
        .get(schemaObj)
        .processOutboundValues(pluginSettings?.config as ConfigValues);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Failed to decrypt data')
      ) {
        this.logger.warn(
          `Failed to decrypt config for plugin "${pluginId}", returning as is!`
        );
        return pluginSettings?.config as ConfigValues;
      }
      throw error;
    }
  }
}
