import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GenerateMediaLinksDto } from '../dtos/generate-links.dto';
import { MediaLinkGeneratorService } from '../services/media-link-generator.service';

@Controller('media/links')
@ApiSdkTag(SdkTag.Media)
@ApiBearerAuth()
export class MediaLinkGeneratorController {
  constructor(
    private readonly mediaLinkGeneratorService: MediaLinkGeneratorService
  ) {}

  @Post()
  @RequirePermission(Permission.MEDIA_CONTAINER_READ)
  @ApiOperation({
    summary: 'Generate links for media containers',
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
    return this.mediaLinkGeneratorService.generateLinks(body);
  }
}
