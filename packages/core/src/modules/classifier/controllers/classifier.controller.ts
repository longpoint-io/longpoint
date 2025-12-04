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
import { ApiClassifierNotFoundResponse } from '../classifier.errors';
import { ClassifierService } from '../classifier.service';
import {
  ClassifierDto,
  ClassifierSummaryDto,
  CreateClassifierDto,
  UpdateClassifierDto,
} from '../dtos';

@Controller('analysis/classifiers')
@ApiSdkTag(SdkTag.Analysis)
@ApiBearerAuth()
export class ClassifierController {
  constructor(private readonly classifierService: ClassifierService) {}

  @Post()
  @RequirePermission(Permission.CLASSIFIERS_CREATE)
  @ApiOperation({
    summary: 'Create a classifier',
    operationId: 'createClassifier',
  })
  @ApiCreatedResponse({ type: ClassifierDto })
  async createClassifier(@Body() body: CreateClassifierDto) {
    const classifier = await this.classifierService.createClassifier(body);
    return classifier.toDto();
  }

  @Get(':classifierId')
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'Get a classifier',
    operationId: 'getClassifier',
  })
  @ApiOkResponse({ type: ClassifierDto })
  @ApiClassifierNotFoundResponse()
  async getClassifier(@Param('classifierId') classifierId: string) {
    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      classifierId
    );
    return classifier.toDto();
  }

  @Get()
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'List classifiers',
    operationId: 'listClassifiers',
  })
  @ApiOkResponse({ type: [ClassifierSummaryDto] })
  async listClassifiers() {
    const classifiers = await this.classifierService.listClassifiers();
    return classifiers.map((classifier) => classifier.toSummaryDto());
  }

  @Patch(':classifierId')
  @RequirePermission(Permission.CLASSIFIERS_UPDATE)
  @ApiOperation({
    summary: 'Update a classifier',
    operationId: 'updateClassifier',
  })
  @ApiOkResponse({ type: ClassifierDto })
  @ApiClassifierNotFoundResponse()
  async updateClassifier(
    @Param('classifierId') classifierId: string,
    @Body() body: UpdateClassifierDto
  ) {
    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      classifierId
    );
    await classifier.update(body);
    return classifier.toDto();
  }

  @Delete(':classifierId')
  @RequirePermission(Permission.CLASSIFIERS_DELETE)
  @ApiOperation({
    summary: 'Delete a classifier',
    operationId: 'deleteClassifier',
  })
  @ApiOkResponse({ description: 'The classifier was deleted' })
  @ApiClassifierNotFoundResponse()
  async deleteClassifier(@Param('classifierId') classifierId: string) {
    const classifier = await this.classifierService.getClassifierByIdOrThrow(
      classifierId
    );
    await classifier.delete();
  }
}
