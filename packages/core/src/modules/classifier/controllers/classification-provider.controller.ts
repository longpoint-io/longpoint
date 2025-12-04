import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ClassificationProviderDto } from '../dtos';
import { ClassificationProviderService } from '../services/classification-provider.service';

@Controller('analysis/classification-providers')
@ApiSdkTag(SdkTag.Analysis)
@ApiBearerAuth()
export class ClassificationProviderController {
  constructor(
    private readonly classificationProviderService: ClassificationProviderService
  ) {}

  @Get()
  @RequirePermission(Permission.CLASSIFIERS_READ)
  @ApiOperation({
    summary: 'List classification providers',
    operationId: 'listClassificationProviders',
  })
  @ApiOkResponse({ type: [ClassificationProviderDto] })
  async listClassificationProviders() {
    const classificationProviders =
      await this.classificationProviderService.listClassificationProviders();
    return classificationProviders.map((classificationProvider) =>
      classificationProvider.toDto()
    );
  }
}
