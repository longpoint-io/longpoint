import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { PaginationQueryDto } from '@/shared/dtos';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ListTransformersResponseDto } from '../dtos/transformers/list-transformers-response.dto';
import { TransformerService } from '../services/transformer.service';

@Controller('transformers')
@ApiSdkTag(SdkTag.Transform)
@ApiBearerAuth()
export class TransformerController {
  constructor(private readonly transformerService: TransformerService) {}

  @Get()
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_READ)
  @ApiOperation({
    summary: 'List installed transformers',
    operationId: 'listTransformers',
  })
  @ApiOkResponse({ type: ListTransformersResponseDto })
  async listTransformers(@Query() query: PaginationQueryDto) {
    const transformers = await this.transformerService.listTransformers(query);
    return new ListTransformersResponseDto({
      items: transformers.map((transformer) => transformer.toDto()),
      path: '/transformers',
      query,
    });
  }
}
