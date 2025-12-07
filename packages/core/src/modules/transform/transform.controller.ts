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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  CreateTransformTemplateDto,
  TransformTemplateDto,
  UpdateTransformTemplateDto,
} from './dtos';
import { ApiTransformTemplateNotFoundResponse } from './transform.errors';
import { TransformService } from './transform.service';

@Controller('transform')
@ApiSdkTag(SdkTag.Transform)
@ApiBearerAuth()
export class TransformController {
  constructor(private readonly transformService: TransformService) {}

  @Post('templates')
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

  @Get('templates/:id')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_READ)
  @ApiOperation({
    summary: 'Get a transform template',
    operationId: 'getTransformTemplate',
  })
  @ApiOkResponse({ type: TransformTemplateDto })
  @ApiTransformTemplateNotFoundResponse()
  async getTransformTemplate(@Param('id') id: string) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(id);
    return template.toDto();
  }

  @Get('templates')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_READ)
  @ApiOperation({
    summary: 'List transform templates',
    operationId: 'listTransformTemplates',
  })
  @ApiOkResponse({ type: [TransformTemplateDto] })
  async listTransformTemplates() {
    const templates = await this.transformService.listTransformTemplates();
    return templates.map((template) => template.toDto());
  }

  @Patch('templates/:id')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_UPDATE)
  @ApiOperation({
    summary: 'Update a transform template',
    operationId: 'updateTransformTemplate',
  })
  @ApiOkResponse({ type: TransformTemplateDto })
  @ApiTransformTemplateNotFoundResponse()
  async updateTransformTemplate(
    @Param('id') id: string,
    @Body() body: UpdateTransformTemplateDto
  ) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(id);
    await template.update(body);
    return template.toDto();
  }

  @Delete('templates/:id')
  @RequirePermission(Permission.TRANSFORM_TEMPLATES_DELETE)
  @ApiOperation({
    summary: 'Delete a transform template',
    operationId: 'deleteTransformTemplate',
  })
  @ApiNoContentResponse()
  @ApiTransformTemplateNotFoundResponse()
  async deleteTransformTemplate(@Param('id') id: string) {
    const template =
      await this.transformService.getTransformTemplateByIdOrThrow(id);
    await template.delete();
  }
}
