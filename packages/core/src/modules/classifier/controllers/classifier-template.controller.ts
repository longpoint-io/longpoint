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
import { ApiSdkTag, RequirePermission } from '../../../shared/decorators';
import { ApiClassifierTemplateNotFoundResponse } from '../classifier.errors';
import {
  ClassifierTemplateDto,
  CreateClassifierTemplateDto,
  ListClassifierTemplatesQueryDto,
  ListClassifierTemplatesResponseDto,
  UpdateClassifierTemplateDto,
} from '../dtos';
import { ClassifierTemplateService } from '../services/classifier-template.service';

@Controller('classifier-templates')
@ApiSdkTag(SdkTag.Classifiers)
@ApiBearerAuth()
export class ClassifierTemplateController {
  constructor(
    private readonly classifierTemplateService: ClassifierTemplateService
  ) {}

  @Post()
  @RequirePermission(Permission.CLASSIFIERS_CREATE)
  @ApiOperation({
    summary: 'Create a classifier template',
    operationId: 'classifiers.createTemplate',
  })
  @ApiCreatedResponse({ type: ClassifierTemplateDto })
  async createClassifierTemplate(@Body() body: CreateClassifierTemplateDto) {
    const classifierTemplate =
      await this.classifierTemplateService.createClassifierTemplate(body);
    return classifierTemplate.toDto();
  }

  @Get(':templateId')
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'Get a classifier template',
    operationId: 'classifiers.getTemplate',
  })
  @ApiOkResponse({ type: ClassifierTemplateDto })
  @ApiClassifierTemplateNotFoundResponse()
  async getClassifierTemplate(@Param('templateId') templateId: string) {
    const classifierTemplate =
      await this.classifierTemplateService.getClassifierTemplateByIdOrThrow(
        templateId
      );
    return classifierTemplate.toDto();
  }

  @Get()
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'List classifier templates',
    operationId: 'classifiers.listTemplates',
    description:
      'Returns both plugin-defined templates (type="plugin") and custom templates (type="custom").',
  })
  @ApiOkResponse({
    description:
      'Returns both plugin-defined templates and custom templates. Plugin templates have type="plugin" and custom templates have type="custom".',
    type: ListClassifierTemplatesResponseDto,
  })
  async listClassifierTemplates(
    @Query() query: ListClassifierTemplatesQueryDto
  ) {
    const templates =
      await this.classifierTemplateService.listClassifierTemplates(query);
    return new ListClassifierTemplatesResponseDto({
      items: templates.map((template) => template.toDto()),
      path: '/classifier-templates',
      query,
    });
  }

  @Patch(':templateId')
  @RequirePermission(Permission.CLASSIFIERS_UPDATE)
  @ApiOperation({
    summary: 'Update a classifier template',
    operationId: 'classifiers.updateTemplate',
  })
  @ApiOkResponse({ type: ClassifierTemplateDto })
  @ApiClassifierTemplateNotFoundResponse()
  async updateClassifierTemplate(
    @Param('templateId') templateId: string,
    @Body() body: UpdateClassifierTemplateDto
  ) {
    const classifierTemplate =
      await this.classifierTemplateService.getClassifierTemplateByIdOrThrow(
        templateId
      );
    await classifierTemplate.update(body);
    return classifierTemplate.toDto();
  }

  @Delete(':templateId')
  @RequirePermission(Permission.CLASSIFIERS_DELETE)
  @ApiOperation({
    summary: 'Delete a classifier template',
    operationId: 'classifiers.deleteTemplate',
  })
  @ApiOkResponse({ description: 'The classifier template was deleted' })
  @ApiClassifierTemplateNotFoundResponse()
  async deleteClassifierTemplate(@Param('templateId') templateId: string) {
    const classifierTemplate =
      await this.classifierTemplateService.getClassifierTemplateByIdOrThrow(
        templateId
      );
    await classifierTemplate.delete();
  }
}
