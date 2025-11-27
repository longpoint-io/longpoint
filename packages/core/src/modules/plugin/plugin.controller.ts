import { ApiSdkTag } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PluginDto, PluginSummaryDto, UpdatePluginSettingsDto } from './dtos';
import { ApiPluginNotFoundResponse } from './plugin.errors';
import { PluginService } from './services';

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
    return plugins.map((plugin) => plugin.toSummaryDto());
  }

  @Get(':pluginId')
  @ApiOperation({
    summary: 'Get a plugin by ID',
    operationId: 'getPlugin',
  })
  @ApiOkResponse({ type: PluginDto })
  @ApiPluginNotFoundResponse()
  async getPlugin(@Param('pluginId') pluginId: string) {
    const plugin = await this.pluginService.getPluginByIdOrThrow(pluginId);
    return plugin.toDto();
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
    const plugin = await this.pluginService.getPluginByIdOrThrow(pluginId);
    await plugin.updateSettings(body.config);
    return plugin.toDto();
  }
}
