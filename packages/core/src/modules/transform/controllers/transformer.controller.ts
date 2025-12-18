import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { PaginationQueryDto } from '@/shared/dtos';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ListTransformersResponseDto } from '../dtos/transformers/list-transformers-response.dto';
import { TransformerDetailsDto } from '../dtos/transformers/transformer.dto';
import { TransformerService } from '../services/transformer.service';
import { ApiTransformerNotFoundResponse } from '../transform.errors';

@Controller('transformers')
@ApiSdkTag(SdkTag.Transformers)
@ApiBearerAuth()
export class TransformerController {
  constructor(private readonly transformerService: TransformerService) {}

  @Get()
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_READ)
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

  @Get(':transformerId')
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_READ)
  @ApiOperation({
    summary: 'Get a transformer',
    operationId: 'getTransformer',
  })
  @ApiOkResponse({ type: TransformerDetailsDto })
  @ApiTransformerNotFoundResponse()
  async getTransformer(@Param('transformerId') transformerId: string) {
    const transformer = await this.transformerService.getTransformerByIdOrThrow(
      transformerId
    );
    return transformer.toDto('details');
  }
}
