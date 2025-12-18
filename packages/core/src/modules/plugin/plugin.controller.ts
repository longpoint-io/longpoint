import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PluginDetailsDto, PluginDto, UpdatePluginSettingsDto } from './dtos';
import { ApiPluginNotFoundResponse } from './plugin.errors';
import { PluginService } from './services';

@Controller('plugins')
@ApiSdkTag(SdkTag.Plugins)
@ApiBearerAuth()
export class PluginController {
  constructor(private readonly pluginService: PluginService) {}

  @Get()
  @RequirePermission(Permission.PLUGINS_READ)
  @ApiOperation({
    summary: 'List all installed plugins',
    operationId: 'listPlugins',
  })
  @ApiOkResponse({ type: [PluginDto] })
  async listPlugins() {
    const plugins = await this.pluginService.listPlugins();
    return plugins.map((plugin) => plugin.toDto());
  }

  @Get(':pluginId')
  @RequirePermission(Permission.PLUGINS_READ)
  @ApiOperation({
    summary: 'Get a plugin by ID',
    operationId: 'getPlugin',
  })
  @ApiOkResponse({ type: PluginDetailsDto })
  @ApiPluginNotFoundResponse()
  async getPlugin(@Param('pluginId') pluginId: string) {
    const plugin = await this.pluginService.getPluginByIdOrThrow(pluginId);
    return plugin.toDetailsDto();
  }

  @Patch(':pluginId/settings')
  @RequirePermission(Permission.PLUGINS_UPDATE)
  @ApiOperation({
    summary: 'Update plugin settings',
    operationId: 'updatePluginSettings',
  })
  @ApiOkResponse({ type: PluginDetailsDto })
  @ApiPluginNotFoundResponse()
  async updatePluginSettings(
    @Param('pluginId') pluginId: string,
    @Body() body: UpdatePluginSettingsDto
  ) {
    const plugin = await this.pluginService.getPluginByIdOrThrow(pluginId);
    await plugin.updateSettings(body.config);
    return plugin.toDetailsDto();
  }
}
