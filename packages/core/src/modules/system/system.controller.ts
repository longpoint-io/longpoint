import { ApiSdkTag, Public, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UpdateSystemSettingsDto } from './dtos';
import { SetupStatusDto } from './dtos/setup-status.dto';
import { SystemStatusDto } from './dtos/system-status.dto';
import { SystemService } from './system.service';

@Controller('system')
@ApiSdkTag(SdkTag.System)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('setup/status')
  @Public()
  @ApiOperation({
    summary: 'Get system setup status',
    operationId: 'getSetupStatus',
  })
  @ApiOkResponse({ type: SetupStatusDto })
  async getSetupStatus() {
    return this.systemService.getSetupStatus();
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get system status',
    operationId: 'getSystemStatus',
  })
  @ApiOkResponse({ type: SystemStatusDto })
  async getSystemStatus() {
    return this.systemService.getSystemStatus();
  }

  @Patch('settings')
  @RequirePermission(Permission.SYSTEM_SETTINGS_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update system settings',
    operationId: 'updateSystemSettings',
  })
  @ApiOkResponse({ type: SystemStatusDto })
  async updateSystemSettings(@Body() body: UpdateSystemSettingsDto) {
    return this.systemService.updateSystemSettings(body);
  }
}
