import { RequirePermission } from '@/shared/decorators';
import { ApiSdkTag } from '@/shared/decorators/api-sdk-tag.decorator';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { StorageProviderDto } from '../dtos';
import { StorageProviderService } from '../services/storage-provider.service';

@Controller('storage/providers')
@ApiSdkTag(SdkTag.Storage)
@ApiBearerAuth()
export class StorageProviderController {
  constructor(
    private readonly storageProviderService: StorageProviderService
  ) {}

  @Get()
  @RequirePermission(Permission.STORAGE_UNITS_READ)
  @ApiOperation({
    summary: 'List installed storage providers',
    operationId: 'listStorageProviders',
  })
  @ApiOkResponse({ type: [StorageProviderDto] })
  async listStorageProviders() {
    const providers = await this.storageProviderService.listProviders();
    return providers.map((provider) => provider.toDto());
  }
}
