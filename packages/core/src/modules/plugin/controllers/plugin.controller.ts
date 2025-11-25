import { ApiSdkTag } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PluginDto, PluginSummaryDto, UpdatePluginSettingsDto } from '../dtos';
import { ApiPluginNotFoundResponse } from '../plugin.errors';
import { PluginService } from '../services/plugin.service';

@Controller('plugins')
@ApiSdkTag(SdkTag.System)
@ApiBearerAuth()
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  @ApiOperation({
    summary: 'List all installed plugins',
    operationId: 'listPlugins',
  })
  @ApiOkResponse({ type: [PluginSummaryDto] })
  async listPlugins() {
    const plugins = await this.pluginService.listPlugins();
    return plugins.map(
      (plugin) =>
        new PluginSummaryDto({
          id: plugin.id,
          displayName: plugin.displayName,
          description: plugin.description,
          icon: plugin.icon,
          type: plugin.type,
          hasSettings: plugin.hasSettings,
        })
    );
  }

  @Get(':pluginId')
  @ApiOperation({
    summary: 'Get a plugin by ID',
    operationId: 'getPlugin',
  })
  @ApiOkResponse({ type: PluginDto })
  @ApiPluginNotFoundResponse()
  async getPlugin(@Param('pluginId') pluginId: string) {
    const plugin = await this.pluginService.getPluginById(pluginId);
    return new PluginDto({
      id: plugin.id,
      displayName: plugin.displayName,
      description: plugin.description,
      icon: plugin.icon,
      type: plugin.type,
      hasSettings: plugin.hasSettings,
      packageName: plugin.packageName,
      settingsSchema: plugin.settingsSchema,
      settingsValues: plugin.settingsValues,
    });
  }

  @Patch(':pluginId/settings')
  @ApiOperation({
    summary: 'Update plugin settings',
    operationId: 'updatePluginSettings',
  })
  @ApiOkResponse({ type: PluginDto })
  @ApiPluginNotFoundResponse()
  async updatePluginSettings(
    @Param('pluginId') pluginId: string,
    @Body() body: UpdatePluginSettingsDto
  ) {
    await this.pluginService.updatePluginSettings(pluginId, body.config);
    const plugin = await this.pluginService.getPluginById(pluginId);
    return new PluginDto({
      id: plugin.id,
      displayName: plugin.displayName,
      description: plugin.description,
      icon: plugin.icon,
      type: plugin.type,
      hasSettings: plugin.hasSettings,
      packageName: plugin.packageName,
      settingsSchema: plugin.settingsSchema,
      settingsValues: plugin.settingsValues,
    });
  }
}

