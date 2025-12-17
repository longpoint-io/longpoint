import { ApiSdkTag } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SearchProviderDto, UpdateSearchProviderConfigDto } from '../dtos';
import { SearchProviderService } from '../services/search-provider.service';

@Controller('search/providers')
@ApiSdkTag(SdkTag.Search)
@ApiBearerAuth()
export class SearchProviderController {
  constructor(private readonly searchProviderService: SearchProviderService) {}

  @Get()
  @ApiOperation({
    summary: 'List installed search providers',
    operationId: 'listSearchProviders',
  })
  @ApiOkResponse({ type: [SearchProviderDto] })
  async listSearchProviders() {
    const providers = await this.searchProviderService.listProviders();
    return providers.map((provider) => provider.toDto());
  }

  @Patch(':providerId')
  @ApiOperation({
    summary: 'Update the config for a search provider',
    operationId: 'updateSearchProviderConfig',
  })
  @ApiOkResponse({ type: SearchProviderDto })
  async updateSearchProviderConfig(
    @Param('providerId') providerId: string,
    @Body() body: UpdateSearchProviderConfigDto
  ) {
    const provider = await this.searchProviderService.updateProviderConfig(
      providerId,
      body.config
    );
    return provider.toDto();
  }
}
