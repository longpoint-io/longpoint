import { ApiSdkTag, Public } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Controller, Param, Put, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { type Request } from 'express';
import { ApiAssetNotFoundResponse } from '../asset/asset.errors';
import { UploadAssetQueryDto } from './dtos/upload-asset.dto';
import { UploadService } from './upload.service';

@Controller('assets')
@ApiSdkTag(SdkTag.Assets)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Put(':assetId/upload')
  @Public()
  @ApiOperation({
    summary: 'Upload an asset variant',
    operationId: 'upload',
  })
  @ApiOkResponse({ description: 'The variant was uploaded' })
  @ApiAssetNotFoundResponse()
  async upload(
    @Param('assetId') assetId: string,
    @Query() query: UploadAssetQueryDto,
    @Req() req: Request
  ) {
    return this.uploadService.upload(assetId, query, req);
  }
}
