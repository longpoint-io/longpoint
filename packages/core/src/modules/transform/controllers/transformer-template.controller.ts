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
  CreateTransformerTemplateDto,
  GenerateVariantDto,
  ListTransformerTemplatesQueryDto,
  ListTransformerTemplatesResponseDto,
  TransformerTemplateDto,
  UpdateTransformerTemplateDto,
} from '../dtos';
import { TransformerTemplateService } from '../services/transformer-template.service';
import { ApiTransformerTemplateNotFoundResponse } from '../transform.errors';

@Controller('transformer-templates')
@ApiSdkTag(SdkTag.Transform)
@ApiBearerAuth()
export class TransformerTemplateController {
  constructor(
    private readonly transformerTemplateService: TransformerTemplateService
  ) {}

  @Post()
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_CREATE)
  @ApiOperation({
    summary: 'Create a transformer template',
    description: 'Define a template for transforming assets.',
    operationId: 'createTransformerTemplate',
  })
  @ApiCreatedResponse({ type: TransformerTemplateDto })
  async createTransformerTemplate(@Body() body: CreateTransformerTemplateDto) {
    const transformerTemplate =
      await this.transformerTemplateService.createTransformerTemplate(body);
    return transformerTemplate.toDto();
  }

  @Get(':templateId')
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_READ)
  @ApiOperation({
    summary: 'Get a transformer template',
    operationId: 'getTransformerTemplate',
  })
  @ApiOkResponse({ type: TransformerTemplateDto })
  @ApiTransformerTemplateNotFoundResponse()
  async getTransformerTemplate(@Param('templateId') templateId: string) {
    const template =
      await this.transformerTemplateService.getTransformerTemplateByIdOrThrow(
        templateId
      );
    return template.toDto();
  }

  @Get()
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_READ)
  @ApiOperation({
    summary: 'List transformer templates',
    operationId: 'listTransformerTemplates',
  })
  @ApiOkResponse({ type: ListTransformerTemplatesResponseDto })
  async listTransformerTemplates(
    @Query() query: ListTransformerTemplatesQueryDto
  ) {
    const templates =
      await this.transformerTemplateService.listTransformerTemplates(query);
    return new ListTransformerTemplatesResponseDto({
      query,
      items: await Promise.all(templates.map((template) => template.toDto())),
      path: '/transformer/templates',
    });
  }

  @Patch(':templateId')
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_UPDATE)
  @ApiOperation({
    summary: 'Update a transformer template',
    operationId: 'updateTransformerTemplate',
  })
  @ApiOkResponse({ type: TransformerTemplateDto })
  @ApiTransformerTemplateNotFoundResponse()
  async updateTransformerTemplate(
    @Param('templateId') templateId: string,
    @Body() body: UpdateTransformerTemplateDto
  ) {
    const template =
      await this.transformerTemplateService.getTransformerTemplateByIdOrThrow(
        templateId
      );
    await template.update(body);
    return template.toDto();
  }

  @Delete(':templateId')
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_DELETE)
  @ApiOperation({
    summary: 'Delete a transformer template',
    operationId: 'deleteTransformerTemplate',
  })
  @ApiOkResponse({ description: 'The transformer template was deleted' })
  @ApiTransformerTemplateNotFoundResponse()
  async deleteTransformerTemplate(@Param('templateId') templateId: string) {
    const template =
      await this.transformerTemplateService.getTransformerTemplateByIdOrThrow(
        templateId
      );
    await template.delete();
  }

  @Post(':templateId/generate-variant')
  @RequirePermission(Permission.TRANSFORMER_TEMPLATES_CREATE)
  @ApiOperation({
    summary: 'Generate a variant from a transformer template',
    description:
      'Creates a new derivative variant by applying the transformer template to the source variant.',
    operationId: 'generateVariantFromTemplate',
  })
  @ApiOkResponse({
    description: 'The variant generation has been initiated',
  })
  @ApiTransformerTemplateNotFoundResponse()
  async generateVariantFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: GenerateVariantDto
  ) {
    const template =
      await this.transformerTemplateService.getTransformerTemplateByIdOrThrow(
        templateId
      );
    // TODO: fire and forget until job queue is implemented
    template.transformAssetVariant(body.sourceVariantId);
  }
}
