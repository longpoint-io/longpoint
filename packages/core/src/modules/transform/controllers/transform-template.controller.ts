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
  CreateTransformTemplateDto,
  GenerateVariantDto,
  ListTransformTemplatesQueryDto,
  ListTransformTemplatesResponseDto,
  TransformTemplateDto,
  UpdateTransformTemplateDto,
} from '../dtos';
import { TransformTemplateService } from '../services/transform-template.service';
import { ApiTransformTemplateNotFoundResponse } from '../transform.errors';

@Controller('transform-templates')
@ApiSdkTag(SdkTag.Transform)
@ApiBearerAuth()
export class TransformController {
  constructor(private readonly transformService: TransformTemplateService) {}

  @Post()
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_CREATE)
  @ApiOperation({
    summary: 'Create a transform template',
    description: 'Define a template for transforming assets.',
    operationId: 'createTransformTemplate',
  })
  @ApiCreatedResponse({ type: TransformTemplateDto })
  async createTransformTemplate(@Body() body: CreateTransformTemplateDto) {
    const transformTemplate =
      await this.transformService.createTransformTemplate(body);
    return transformTemplate.toDto();
  }

  @Get(':templateId')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_READ)
  @ApiOperation({
    summary: 'Get a transform template',
    operationId: 'getTransformTemplate',
  })
  @ApiOkResponse({ type: TransformTemplateDto })
  @ApiTransformTemplateNotFoundResponse()
  async getTransformTemplate(@Param('templateId') templateId: string) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(templateId);
    return template.toDto();
  }

  @Get()
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_READ)
  @ApiOperation({
    summary: 'List transform templates',
    operationId: 'listTransformTemplates',
  })
  @ApiOkResponse({ type: ListTransformTemplatesResponseDto })
  async listTransformTemplates(@Query() query: ListTransformTemplatesQueryDto) {
    const templates = await this.transformService.listTransformTemplates(query);
    return new ListTransformTemplatesResponseDto({
      query,
      items: await Promise.all(templates.map((template) => template.toDto())),
      path: '/transform/templates',
    });
  }

  @Patch(':templateId')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_UPDATE)
  @ApiOperation({
    summary: 'Update a transform template',
    operationId: 'updateTransformTemplate',
  })
  @ApiOkResponse({ type: TransformTemplateDto })
  @ApiTransformTemplateNotFoundResponse()
  async updateTransformTemplate(
    @Param('templateId') templateId: string,
    @Body() body: UpdateTransformTemplateDto
  ) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(templateId);
    await template.update(body);
    return template.toDto();
  }

  @Delete(':templateId')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_DELETE)
  @ApiOperation({
    summary: 'Delete a transform template',
    operationId: 'deleteTransformTemplate',
  })
  @ApiOkResponse({ description: 'The transform template was deleted' })
  @ApiTransformTemplateNotFoundResponse()
  async deleteTransformTemplate(@Param('templateId') templateId: string) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(templateId);
    await template.delete();
  }

  @Post(':templateId/generate-variant')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_CREATE)
  @ApiOperation({
    summary: 'Generate a variant from a transform template',
    description:
      'Creates a new derivative variant by applying the transform template to the source variant.',
    operationId: 'generateVariantFromTemplate',
  })
  @ApiOkResponse({
    description: 'The variant generation has been initiated',
  })
  @ApiTransformTemplateNotFoundResponse()
  async generateVariantFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: GenerateVariantDto
  ) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(templateId);
    // TODO: fire and forget until job queue is implemented
    template.transformAssetVariant(body.sourceVariantId);
  }
}
