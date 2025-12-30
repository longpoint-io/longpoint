import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SearchQueryDto, SearchResultsDto } from '../dtos';
import { SearchIndexService } from '../services/search-index.service';

@Controller('search')
@ApiSdkTag(SdkTag.Assets)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchIndexService: SearchIndexService) {}

  @Post('assets')
  @RequirePermission(Permission.ASSETS_READ)
  @ApiOperation({
    summary: 'Search assets with the active search provider',
    operationId: 'assets.search',
  })
  @ApiOkResponse({ type: SearchResultsDto })
  async search(@Body() body: SearchQueryDto): Promise<SearchResultsDto> {
    const activeIndex = await this.searchIndexService.getActiveIndex();

    if (!activeIndex) {
      return new SearchResultsDto({
        query: body,
        items: [],
        path: '/search/assets',
      });
    }

    const results = await activeIndex.query(body);

    return new SearchResultsDto({
      query: body,
      items: results,
      path: '/search/assets',
    });
  }
}
