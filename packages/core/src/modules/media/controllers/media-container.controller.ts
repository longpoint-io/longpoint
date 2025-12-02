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
  CreateMediaContainerDto,
  CreateMediaContainerResponseDto,
  DeleteMediaContainerDto,
  ListMediaContainersQueryDto,
  ListMediaContainersResponseDto,
  MediaContainerDto,
  UpdateMediaContainerDto,
} from '../dtos';
import {
  ApiMediaContainerAlreadyExistsResponse,
  ApiMediaContainerNotFoundResponse,
} from '../media.errors';
import { MediaContainerService } from '../services/media-container.service';

@Controller('media/containers')
@ApiSdkTag(SdkTag.Media)
@ApiBearerAuth()
export class MediaContainerController {
  constructor(private readonly mediaContainerService: MediaContainerService) {}

  @Get()
  @RequirePermission(Permission.MEDIA_CONTAINER_READ)
  @ApiOperation({
    summary: 'List media containers',
    operationId: 'listMediaContainers',
  })
  @ApiOkResponse({ type: ListMediaContainersResponseDto })
  async listMediaContainers(@Query() query: ListMediaContainersQueryDto) {
    const containers = await this.mediaContainerService.listMediaContainers(
      query
    );
    return new ListMediaContainersResponseDto({
      items: await Promise.all(containers.map((c) => c.toSummaryDto())),
      path: '/media/containers',
      query,
    });
  }

  @Post()
  @RequirePermission(Permission.MEDIA_CONTAINER_CREATE)
  @ApiOperation({
    summary: 'Create a media container',
    operationId: 'createMedia',
    description:
      'Creates an empty container that is ready to receive an upload.',
  })
  @ApiCreatedResponse({
    description: 'Use the returned signed url to upload the original asset.',
    type: CreateMediaContainerResponseDto,
  })
  async createMediaContainer(@Body() body: CreateMediaContainerDto) {
    const { container, uploadUrl, uploadToken } =
      await this.mediaContainerService.createMediaContainer(body);

    return new CreateMediaContainerResponseDto({
      id: container.id,
      name: container.name,
      status: container.status,
      url: uploadUrl,
      expiresAt: uploadToken.expiresAt,
    });
  }

  @Get(':containerId')
  @RequirePermission(Permission.MEDIA_CONTAINER_READ)
  @ApiOperation({
    summary: 'Get a media container',
    operationId: 'getMedia',
  })
  @ApiOkResponse({ type: MediaContainerDto })
  @ApiMediaContainerNotFoundResponse()
  async getMediaContainer(@Param('containerId') containerId: string) {
    const container =
      await this.mediaContainerService.getMediaContainerByIdOrThrow(
        containerId
      );
    return container.toDto();
  }

  @Patch(':containerId')
  @RequirePermission(Permission.MEDIA_CONTAINER_UPDATE)
  @ApiOperation({
    summary: 'Update a media container',
    operationId: 'updateMedia',
  })
  @ApiOkResponse({ type: MediaContainerDto })
  @ApiMediaContainerNotFoundResponse()
  @ApiMediaContainerAlreadyExistsResponse()
  async updateMediaContainer(
    @Param('containerId') containerId: string,
    @Body() body: UpdateMediaContainerDto
  ) {
    const container =
      await this.mediaContainerService.getMediaContainerByIdOrThrow(
        containerId
      );
    await container.update(body);
    return container.toDto();
  }

  @Delete(':containerId')
  @RequirePermission(Permission.MEDIA_CONTAINER_DELETE)
  @ApiOperation({
    summary: 'Delete a media container',
    operationId: 'deleteMedia',
    description: 'All associated assets will be deleted.',
  })
  @ApiOkResponse({ description: 'The media container was deleted' })
  async deleteMediaContainer(
    @Param('containerId') containerId: string,
    @Body() body: DeleteMediaContainerDto
  ) {
    const container =
      await this.mediaContainerService.getMediaContainerByIdOrThrow(
        containerId
      );
    await container.delete(body.permanently);
    return container.toDto();
  }
}
