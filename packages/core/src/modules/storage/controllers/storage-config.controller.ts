import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateStorageConfigDto,
  StorageConfigDto,
  StorageConfigSummaryDto,
  UpdateStorageConfigDto,
} from '../dtos';
import { StorageProviderConfigService } from '../services/storage-provider-config.service';
import {
  ApiStorageProviderConfigInUseResponse,
  ApiStorageProviderConfigNotFoundResponse,
} from '../storage.errors';

@Controller('storage/configs')
@ApiSdkTag(SdkTag.Storage)
@ApiBearerAuth()
export class StorageConfigController {
  constructor(
    private readonly storageProviderConfigService: StorageProviderConfigService
  ) {}

  @Post()
  @RequirePermission(Permission.STORAGE_UNITS_CREATE)
  @ApiOperation({
    summary: 'Create a storage provider config',
    operationId: 'createStorageConfig',
  })
  @ApiCreatedResponse({ type: StorageConfigDto })
  async createStorageConfig(@Body() body: CreateStorageConfigDto) {
    const config = await this.storageProviderConfigService.createConfig(body);
    return config.toDto();
  }

  @Get()
  @RequirePermission(Permission.STORAGE_UNITS_READ)
  @ApiOperation({
    summary: 'List storage configs',
    operationId: 'listStorageConfigs',
  })
  @ApiOkResponse({ type: [StorageConfigSummaryDto] })
  async listStorageConfigs(@Query('providerId') providerId?: string) {
    const configs = await this.storageProviderConfigService.listConfigs(
      providerId
    );
    return Promise.all(configs.map((config) => config.toSummaryDto()));
  }

  @Get(':id')
  @RequirePermission(Permission.STORAGE_UNITS_READ)
  @ApiOperation({
    summary: 'Get a storage config',
    operationId: 'getStorageConfig',
  })
  @ApiOkResponse({ type: StorageConfigDto })
  @ApiStorageProviderConfigNotFoundResponse()
  async getStorageConfig(@Param('id') id: string) {
    const config = await this.storageProviderConfigService.getConfigByIdOrThrow(
      id
    );
    return config.toDto();
  }

  @Patch(':id')
  @RequirePermission(Permission.STORAGE_UNITS_UPDATE)
  @ApiOperation({
    summary: 'Update a storage config',
    operationId: 'updateStorageConfig',
  })
  @ApiOkResponse({ type: StorageConfigDto })
  @ApiStorageProviderConfigNotFoundResponse()
  async updateStorageConfig(
    @Param('id') id: string,
    @Body() body: UpdateStorageConfigDto
  ) {
    const config = await this.storageProviderConfigService.updateConfig(
      id,
      body
    );
    return config.toDto();
  }

  @Delete(':id')
  @RequirePermission(Permission.STORAGE_UNITS_DELETE)
  @ApiOperation({
    summary: 'Delete a storage config',
    operationId: 'deleteStorageConfig',
  })
  @ApiOkResponse({ description: 'The storage config was deleted' })
  @ApiStorageProviderConfigNotFoundResponse()
  @ApiStorageProviderConfigInUseResponse()
  async deleteStorageConfig(@Param('id') id: string) {
    await this.storageProviderConfigService.deleteConfig(id);
  }
}
