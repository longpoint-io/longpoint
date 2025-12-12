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
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiSdkTag, RequirePermission } from '../../../shared/decorators';
import { ApiClassifierTemplateNotFoundResponse } from '../classifier.errors';
import {
  ClassifierTemplateDto,
  ClassifierTemplateSummaryDto,
  CreateClassifierTemplateDto,
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
    operationId: 'createClassifierTemplate',
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
    operationId: 'getClassifierTemplate',
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
    operationId: 'listClassifierTemplates',
  })
  @ApiOkResponse({ type: [ClassifierTemplateSummaryDto] })
  async listClassifierTemplates() {
    const classifierTemplates =
      await this.classifierTemplateService.listClassifierTemplates();
    return classifierTemplates.map((classifierTemplate) =>
      classifierTemplate.toSummaryDto()
    );
  }

  @Patch(':templateId')
  @RequirePermission(Permission.CLASSIFIERS_UPDATE)
  @ApiOperation({
    summary: 'Update a classifier template',
    operationId: 'updateClassifierTemplate',
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
    operationId: 'deleteClassifierTemplate',
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
