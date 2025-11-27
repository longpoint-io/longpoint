import { ConfigSchemaService } from '@/modules/common/services';
import { PrismaService } from '@/modules/common/services/prisma/prisma.service';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Injectable } from '@nestjs/common';
import { PluginEntity } from '../entities';
import { PluginNotFound } from '../plugin.errors';
import { PluginRegistryService } from './plugin-registry.service';

@Injectable()
export class PluginService {
  constructor(
    private readonly pluginRegistryService: PluginRegistryService,
    private readonly configSchemaService: ConfigSchemaService,
    private readonly prismaService: PrismaService
  ) {}

  /**
   * List all installed plugins.
   */
  async listPlugins(): Promise<PluginEntity[]> {
    const registryEntries = this.pluginRegistryService.listPlugins();

    return Promise.all(
      registryEntries.map(async (entry) => {
        const settingsSchema = entry.pluginConfig.contributes?.settings;
        let settingsValues: ConfigValues | undefined;

        if (settingsSchema) {
          settingsValues = await this.getPluginSettingsFromDb(
            entry.pluginId,
            settingsSchema
          );
        }

        return new PluginEntity({
          registryEntry: entry,
          settingsSchema,
          settingsValues,
          prismaService: this.prismaService,
          configSchemaService: this.configSchemaService,
        });
      })
    );
  }

  /**
   * Get a specific plugin by ID with its current settings.
   */
  async getPluginById(pluginId: string): Promise<PluginEntity | null> {
    const registryEntry = this.pluginRegistryService.getPluginById(pluginId);

    if (!registryEntry) {
      return null;
    }

    const settingsSchema = registryEntry.pluginConfig.contributes?.settings;
    let settingsValues: ConfigValues | undefined;

    if (settingsSchema) {
      settingsValues = await this.getPluginSettingsFromDb(
        pluginId,
        settingsSchema
      );
    }

    return new PluginEntity({
      registryEntry,
      settingsSchema,
      settingsValues,
      prismaService: this.prismaService,
      configSchemaService: this.configSchemaService,
    });
  }

  /**
   * Get a specific plugin by ID and throw an error if not found.
   */
  async getPluginByIdOrThrow(pluginId: string): Promise<PluginEntity> {
    const plugin = await this.getPluginById(pluginId);
    if (!plugin) {
      throw new PluginNotFound(pluginId);
    }
    return plugin;
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
        // Return as-is if decryption fails
        return pluginSettings?.config as ConfigValues;
      }
      throw error;
    }
  }
}
