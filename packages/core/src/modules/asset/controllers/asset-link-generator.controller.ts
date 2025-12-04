import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GenerateMediaLinksDto } from '../dtos/generate-links.dto';
import { AssetLinkGeneratorService } from '../services/asset-link-generator.service';

@Controller('asset-links')
@ApiSdkTag(SdkTag.Assets)
@ApiBearerAuth()
export class AssetLinkGeneratorController {
  constructor(
    private readonly assetLinkGeneratorService: AssetLinkGeneratorService
  ) {}

  @Post()
  @RequirePermission(Permission.ASSETS_READ)
  @ApiOperation({
    summary: 'Generate links for assets',
    operationId: 'generateLinks',
  })
  @ApiOkResponse({
    description: 'The generated links',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
      example: {
        r2qwyd76nvd98cu6ewg8ync2:
          'https://example.com/r2qwyd76nvd98cu6ewg8ync2/primary.jpg?sig=1234567890&expires=1716393600',
      },
    },
  })
  generateLinks(@Body() body: GenerateMediaLinksDto) {
    return this.assetLinkGeneratorService.generateLinks(body);
  }
}
