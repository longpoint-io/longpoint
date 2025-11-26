import { ConfigSchemaService } from '@/modules/common/services';
import { PrismaService } from '@/modules/common/services/prisma/prisma.service';
import { InvalidInput } from '@/shared/errors';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable, Logger } from '@nestjs/common';
import { PluginNotFound } from '../plugin.errors';
import { PluginRegistryService, PluginType } from './plugin-registry.service';

export interface PluginInfo {
  id: string;
  displayName: string;
  description?: string;
  icon?: string;
  type?: PluginType;
  hasSettings: boolean;
  packageName: string;
}

export interface PluginDetailInfo extends PluginInfo {
  settingsSchema?: ConfigSchemaDefinition;
  settingsValues?: ConfigValues;
}

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);

  constructor(
    private readonly pluginRegistryService: PluginRegistryService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly prismaService: PrismaService
  ) {}

  /**
   * List all installed plugins, aggregating from both pluginRegistry and classificationProviderRegistry.
   * Deduplicates by pluginId.
   */
  async listPlugins(): Promise<PluginInfo[]> {
    const pluginMap = new Map<string, PluginInfo>();

    // Add type-specific plugins (storage, ai)
    // Note: Vector providers now use LongpointPluginConfig format
    const types: PluginType[] = ['storage', 'ai'];
    for (const type of types) {
      const plugins = this.pluginRegistryService.listPlugins(type);
      for (const plugin of plugins) {
        pluginMap.set(plugin.derivedId, {
          id: plugin.derivedId,
          displayName: plugin.manifest.displayName,
          description: plugin.manifest.description,
          icon: plugin.manifest.image,
          type: plugin.type,
          hasSettings: false, // Type-specific plugins don't have settings
          packageName: plugin.packageName,
        });
      }
    }

    // Add LongpointPluginConfig plugins (deduplicate by pluginId)
    const classificationProviders =
      this.pluginRegistryService.listClassificationProviders();
    const vectorProviders = this.pluginRegistryService.listVectorProviders();
    const longpointPluginMap = new Map<
      string,
      {
        pluginId: string;
        pluginConfig: any;
        packageName: string;
      }
    >();

    // Add classification provider plugins
    for (const entry of classificationProviders) {
      if (!longpointPluginMap.has(entry.pluginId)) {
        longpointPluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          pluginConfig: entry.pluginConfig,
          packageName: entry.packageName,
        });
      }
    }

    // Add vector provider plugins
    for (const entry of vectorProviders) {
      if (!longpointPluginMap.has(entry.pluginId)) {
        longpointPluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          pluginConfig: entry.pluginConfig,
          packageName: entry.packageName,
        });
      }
    }

    for (const entry of longpointPluginMap.values()) {
      const pluginConfig = entry.pluginConfig;
      const hasSettings = !!pluginConfig.contributes?.settings;

      pluginMap.set(entry.pluginId, {
        id: entry.pluginId,
        displayName: pluginConfig.displayName || entry.pluginId,
        description: pluginConfig.description,
        icon: pluginConfig.icon,
        hasSettings,
        packageName: entry.packageName,
      });
    }

    return Array.from(pluginMap.values());
  }

  /**
   * Get a specific plugin by ID with its current settings.
   */
  async getPluginById(pluginId: string): Promise<PluginDetailInfo> {
    // Check type-specific plugins first (storage, ai)
    // Note: Vector providers now use LongpointPluginConfig format
    const types: PluginType[] = ['storage', 'ai'];
    for (const type of types) {
      const plugin = this.pluginRegistryService.getPluginById(pluginId);
      if (plugin && plugin.type === type) {
        return {
          id: plugin.derivedId,
          displayName: plugin.manifest.displayName,
          description: plugin.manifest.description,
          icon: plugin.manifest.image,
          type: plugin.type,
          hasSettings: false,
          packageName: plugin.packageName,
        };
      }
    }

    // Check LongpointPluginConfig plugins (classification providers)
    const classificationProviders =
      this.pluginRegistryService.listClassificationProviders();
    let pluginEntry = classificationProviders.find(
      (entry) => entry.pluginId === pluginId
    );

    // If not found, check vector providers
    if (!pluginEntry) {
      const vectorProviders = this.pluginRegistryService.listVectorProviders();
      const vectorEntry = vectorProviders.find(
        (entry) => entry.pluginId === pluginId
      );
      if (vectorEntry) {
        pluginEntry = {
          pluginId: vectorEntry.pluginId,
          pluginConfig: vectorEntry.pluginConfig,
          packageName: vectorEntry.packageName,
        } as any;
      }
    }

    if (!pluginEntry) {
      throw new PluginNotFound(pluginId);
    }

    const pluginConfig = pluginEntry.pluginConfig;
    const settingsSchema = pluginConfig.contributes?.settings;
    const hasSettings = !!settingsSchema;

    let settingsValues: ConfigValues | undefined;
    if (hasSettings && settingsSchema) {
      settingsValues = await this.getPluginSettingsFromDb(
        pluginId,
        settingsSchema
      );
    }

    return {
      id: pluginEntry.pluginId,
      displayName: pluginConfig.displayName || pluginEntry.pluginId,
      description: pluginConfig.description,
      icon: pluginConfig.icon,
      hasSettings,
      packageName: pluginEntry.packageName,
      settingsSchema,
      settingsValues,
    };
  }

  /**
   * Update the configuration values for a plugin.
   */
  async updatePluginSettings(
    pluginId: string,
    configValues: ConfigValues
  ): Promise<ConfigValues> {
    // Check classification providers first
    const classificationProviders =
      this.pluginRegistryService.listClassificationProviders();
    let pluginEntry = classificationProviders.find(
      (entry) => entry.pluginId === pluginId
    );

    // If not found, check vector providers
    if (!pluginEntry) {
      const vectorProviders = this.pluginRegistryService.listVectorProviders();
      const vectorEntry = vectorProviders.find(
        (entry) => entry.pluginId === pluginId
      );
      if (vectorEntry) {
        pluginEntry = {
          pluginId: vectorEntry.pluginId,
          pluginConfig: vectorEntry.pluginConfig,
          packageName: vectorEntry.packageName,
        } as any;
      }
    }

    if (!pluginEntry) {
      throw new PluginNotFound(pluginId);
    }

    const settingsSchema = pluginEntry.pluginConfig.contributes?.settings;
    if (!settingsSchema) {
      throw new InvalidInput('Plugin does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(settingsSchema)
      .processInboundValues(configValues);

    await this.prismaService.pluginSettings.upsert({
      where: { pluginId },
      update: { config: inboundConfig },
      create: { pluginId, config: inboundConfig },
    });

    return inboundConfig;
  }

  /**
   * Get plugin settings from database.
   */
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
