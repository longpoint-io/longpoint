import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAssetVariantNotFoundResponse } from '../asset.errors';
import {
  AssetVariantDto,
  DeleteAssetVariantsDto,
  UpdateAssetVariantDto,
} from '../dtos';
import { AssetService } from '../services/asset.service';

@Controller('asset-variants')
@ApiSdkTag(SdkTag.Assets)
@ApiBearerAuth()
export class AssetVariantController {
  constructor(private readonly assetService: AssetService) {}

  @Patch(':variantId')
  @RequirePermission(Permission.ASSETS_UPDATE)
  @ApiOperation({
    summary: 'Update an asset variant',
    operationId: 'assets.updateVariant',
  })
  @ApiOkResponse({ type: AssetVariantDto })
  @ApiAssetVariantNotFoundResponse()
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() body: UpdateAssetVariantDto
  ) {
    const variant = await this.assetService.getAssetVariantByIdOrThrow(
      variantId
    );
    await variant.update(body);
    return variant.toDto();
  }

  @Delete()
  @RequirePermission(Permission.ASSETS_DELETE)
  @ApiOperation({
    summary: 'Delete one or more asset variants',
    operationId: 'assets.deleteVariants',
  })
  @ApiOkResponse({ description: 'The asset variants were deleted' })
  @ApiAssetVariantNotFoundResponse()
  async deleteVariants(@Body() body: DeleteAssetVariantsDto) {
    await this.assetService.deleteAssetVariants(body.variantIds);
  }
}
