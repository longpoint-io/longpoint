import { ConfigSchemaService, PrismaService } from '@/modules/common/services';
import { PluginRegistryEntry } from '@/modules/plugin/services';
import { ConfigSchemaDefinition, ConfigValues } from '@longpoint/config-schema';
import { Logger } from '@nestjs/common';
import { PluginDto, PluginSummaryDto } from '../dtos';

export interface PluginEntityArgs {
  registryEntry: PluginRegistryEntry;
  settingsSchema?: ConfigSchemaDefinition;
  settingsValues?: ConfigValues;
  prismaService: PrismaService;
  configSchemaService: ConfigSchemaService;
}

export class PluginEntity {
  readonly id: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly hasSettings: boolean;
  readonly packageName: string;
  private readonly settingsSchema?: ConfigSchemaDefinition;
  private _settingsValues?: ConfigValues;
  private readonly prismaService: PrismaService;
  private readonly configSchemaService: ConfigSchemaService;
  private readonly logger = new Logger(PluginEntity.name);

  constructor(args: PluginEntityArgs) {
    const { registryEntry, settingsSchema, settingsValues } = args;
    this.id = registryEntry.pluginId;
    this.displayName =
      registryEntry.pluginConfig.displayName || registryEntry.pluginId;
    this.description = registryEntry.pluginConfig.description ?? null;
    this.icon = registryEntry.pluginConfig.icon ?? null;
    this.hasSettings = !!settingsSchema;
    this.packageName = registryEntry.packageName;
    this.settingsSchema = settingsSchema;
    this._settingsValues = settingsValues;
    this.prismaService = args.prismaService;
    this.configSchemaService = args.configSchemaService;
  }

  get settingsValues(): ConfigValues | undefined {
    return this._settingsValues;
  }

  /**
   * Update the configuration values for this plugin.
   */
  async updateSettings(configValues: ConfigValues): Promise<ConfigValues> {
    if (!this.settingsSchema) {
      throw new Error('Plugin does not support configuration');
    }

    const inboundConfig = await this.configSchemaService
      .get(this.settingsSchema)
      .processInboundValues(configValues);

    await this.prismaService.pluginSettings.upsert({
      where: { pluginId: this.id },
      update: { config: inboundConfig },
      create: { pluginId: this.id, config: inboundConfig },
    });

    this._settingsValues = await this.loadSettingsFromDb();

    return inboundConfig;
  }

  /**
   * Reload settings from database.
   */
  async reloadSettings(): Promise<void> {
    this._settingsValues = await this.loadSettingsFromDb();
  }

  /**
   * Get plugin settings from database.
   */
  private async loadSettingsFromDb(): Promise<ConfigValues> {
    const pluginSettings = await this.prismaService.pluginSettings.findUnique({
      where: {
        pluginId: this.id,
      },
    });

    if (!pluginSettings) {
      return {};
    }

    if (!this.settingsSchema) {
      return pluginSettings.config as ConfigValues;
    }

    try {
      return await this.configSchemaService
        .get(this.settingsSchema)
        .processOutboundValues(pluginSettings.config as ConfigValues);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Failed to decrypt data')
      ) {
        this.logger.warn(
          `Failed to decrypt config for plugin "${this.id}", returning as is!`
        );
        return pluginSettings.config as ConfigValues;
      }
      throw error;
    }
  }

  toDto(): PluginDto {
    return new PluginDto({
      id: this.id,
      displayName: this.displayName,
      description: this.description,
      icon: this.icon,
      hasSettings: this.hasSettings,
      packageName: this.packageName,
      settingsSchema: this.settingsSchema,
      settingsValues: this._settingsValues,
    });
  }

  toSummaryDto(): PluginSummaryDto {
    return new PluginSummaryDto({
      id: this.id,
      displayName: this.displayName,
      description: this.description,
      icon: this.icon,
      hasSettings: this.hasSettings,
    });
  }
}
