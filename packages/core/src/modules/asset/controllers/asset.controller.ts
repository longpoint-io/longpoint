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
  ApiAssetAlreadyExistsResponse,
  ApiAssetNotFoundResponse,
} from '../asset.errors';
import {
  AssetDetailsDto,
  CreateAssetDto,
  CreateAssetResponseDto,
  DeleteAssetDto,
  ListAssetsQueryDto,
  ListAssetsResponseDto,
  UpdateAssetDto,
} from '../dtos';
import { AssetService } from '../services/asset.service';

@Controller('assets')
@ApiSdkTag(SdkTag.Assets)
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @RequirePermission(Permission.ASSETS_READ)
  @ApiOperation({
    summary: 'List assets',
    operationId: 'assets.list',
  })
  @ApiOkResponse({ type: ListAssetsResponseDto })
  async listAssets(@Query() query: ListAssetsQueryDto) {
    const assets = await this.assetService.listAssets(query);
    return new ListAssetsResponseDto({
      items: assets.map((a) => a.toDto()),
      path: '/assets',
      query,
    });
  }

  @Post()
  @RequirePermission(Permission.ASSETS_CREATE)
  @ApiOperation({
    summary: 'Create an asset',
    operationId: 'assets.create',
    description: 'Creates an empty asset that is ready to receive an upload.',
  })
  @ApiCreatedResponse({
    description: 'Use the returned signed url to upload the original variant.',
    type: CreateAssetResponseDto,
  })
  async createAsset(@Body() body: CreateAssetDto) {
    const { asset, uploadUrl, uploadToken } =
      await this.assetService.createAsset(body);

    return new CreateAssetResponseDto({
      id: asset.id,
      name: asset.name,
      status: asset.status,
      url: uploadUrl,
      expiresAt: uploadToken.expiresAt,
    });
  }

  @Get(':assetId')
  @RequirePermission(Permission.ASSETS_READ)
  @ApiOperation({
    summary: 'Get an asset',
    operationId: 'assets.get',
  })
  @ApiOkResponse({ type: AssetDetailsDto })
  @ApiAssetNotFoundResponse()
  async getAsset(@Param('assetId') assetId: string) {
    const asset = await this.assetService.getAssetByIdOrThrow(assetId);
    return asset.toDetailsDto();
  }

  @Patch(':assetId')
  @RequirePermission(Permission.ASSETS_UPDATE)
  @ApiOperation({
    summary: 'Update an asset',
    operationId: 'assets.update',
  })
  @ApiOkResponse({ type: AssetDetailsDto })
  @ApiAssetNotFoundResponse()
  @ApiAssetAlreadyExistsResponse()
  async updateAsset(
    @Param('assetId') assetId: string,
    @Body() body: UpdateAssetDto
  ) {
    const asset = await this.assetService.getAssetByIdOrThrow(assetId);
    await asset.update(body);
    return asset.toDetailsDto();
  }

  @Delete(':assetId')
  @RequirePermission(Permission.ASSETS_DELETE)
  @ApiOperation({
    summary: 'Delete an asset',
    operationId: 'assets.delete',
    description: 'All associated variants will be deleted.',
  })
  @ApiOkResponse({ description: 'The asset was deleted' })
  async deleteAsset(
    @Param('assetId') assetId: string,
    @Body() body: DeleteAssetDto
  ) {
    const asset = await this.assetService.getAssetByIdOrThrow(assetId);
    await asset.delete(body.permanently);
  }
}
