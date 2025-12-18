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
  CreateStorageUnitDto,
  ListStorageUnitsQueryDto,
  ListStorageUnitsResponseDto,
  StorageUnitDto,
  UpdateStorageUnitDto,
} from '../dtos';
import { StorageUnitService } from '../services/storage-unit.service';
import {
  ApiCannotDeleteDefaultStorageUnitResponse,
  ApiStorageUnitInUseResponse,
  ApiStorageUnitNotFoundResponse,
} from '../storage.errors';

@Controller('storage/units')
@ApiSdkTag(SdkTag.Storage)
@ApiBearerAuth()
export class StorageUnitController {
  constructor(private readonly storageUnitService: StorageUnitService) {}

  @Post()
  @RequirePermission(Permission.STORAGE_UNITS_CREATE)
  @ApiOperation({
    summary: 'Create a storage unit',
    operationId: 'createStorageUnit',
  })
  @ApiCreatedResponse({ type: StorageUnitDto })
  async createStorageUnit(@Body() body: CreateStorageUnitDto) {
    const storageUnit = await this.storageUnitService.createStorageUnit(body);
    return storageUnit.toDto();
  }

  @Get()
  @RequirePermission(Permission.STORAGE_UNITS_READ)
  @ApiOperation({
    summary: 'List storage units',
    operationId: 'listStorageUnits',
  })
  @ApiOkResponse({ type: ListStorageUnitsResponseDto })
  async listStorageUnits(@Query() query: ListStorageUnitsQueryDto) {
    const storageUnits = await this.storageUnitService.listStorageUnits(query);
    return new ListStorageUnitsResponseDto({
      query,
      items: await Promise.all(storageUnits.map((unit) => unit.toDto())),
      path: '/storage-units',
    });
  }

  @Get(':storageUnitId')
  @RequirePermission(Permission.STORAGE_UNITS_READ)
  @ApiOperation({
    summary: 'Get a storage unit',
    operationId: 'getStorageUnit',
  })
  @ApiOkResponse({ type: StorageUnitDto })
  @ApiStorageUnitNotFoundResponse()
  async getStorageUnit(@Param('storageUnitId') id: string) {
    const storageUnit = await this.storageUnitService.getStorageUnitByIdOrThrow(
      id
    );
    return storageUnit.toDto();
  }

  @Patch(':storageUnitId')
  @RequirePermission(Permission.STORAGE_UNITS_UPDATE)
  @ApiOperation({
    summary: 'Update a storage unit',
    operationId: 'updateStorageUnit',
  })
  @ApiOkResponse({ type: StorageUnitDto })
  @ApiStorageUnitNotFoundResponse()
  async updateStorageUnit(
    @Param('storageUnitId') id: string,
    @Body() body: UpdateStorageUnitDto
  ) {
    const storageUnit = await this.storageUnitService.getStorageUnitByIdOrThrow(
      id
    );
    await storageUnit.update(body);
    return storageUnit.toDto();
  }

  @Delete(':storageUnitId')
  @RequirePermission(Permission.STORAGE_UNITS_DELETE)
  @ApiOperation({
    summary: 'Delete a storage unit',
    operationId: 'deleteStorageUnit',
  })
  @ApiOkResponse({ description: 'The storage unit was deleted' })
  @ApiStorageUnitNotFoundResponse()
  @ApiStorageUnitInUseResponse()
  @ApiCannotDeleteDefaultStorageUnitResponse()
  async deleteStorageUnit(@Param('storageUnitId') id: string) {
    const storageUnit = await this.storageUnitService.getStorageUnitByIdOrThrow(
      id
    );
    await storageUnit.delete();
  }
}
