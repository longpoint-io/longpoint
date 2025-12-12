import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ClassifierDto } from '../dtos';
import { ClassifierService } from '../services/classifier.service';

@Controller('analysis/classifiers')
@ApiSdkTag(SdkTag.Classifiers)
@ApiBearerAuth()
export class ClassifierController {
  constructor(private readonly classifierService: ClassifierService) {}

  @Get()
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'List classifiers',
    operationId: 'listClassifiers',
  })
  @ApiOkResponse({ type: [ClassifierDto] })
  async listClassifiers() {
    const classifiers = await this.classifierService.listClassifiers();
    return classifiers.map((classifier) => classifier.toDto());
  }
}
