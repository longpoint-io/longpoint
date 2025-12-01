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
  CollectionDetailsDto,
  CollectionDto,
  CreateCollectionDto,
  ListCollectionsQueryDto,
  ListCollectionsResponseDto,
  UpdateCollectionDto,
} from '../dtos';
import { RemoveContainersFromCollectionDto } from '../dtos/collections/remove-containers-from-collection.dto';
import { ApiCollectionNotFoundResponse } from '../media.errors';
import { CollectionService } from '../services/collection.service';

@Controller('media/collections')
@ApiSdkTag(SdkTag.Media)
@ApiBearerAuth()
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  @RequirePermission(Permission.COLLECTION_CREATE)
  @ApiOperation({
    summary: 'Create a collection',
    operationId: 'createCollection',
    description: 'Creates a new collection for organizing media containers.',
  })
  @ApiCreatedResponse({
    description: 'The collection was created successfully',
    type: CollectionDto,
  })
  async createCollection(@Body() body: CreateCollectionDto) {
    const collection = await this.collectionService.createCollection(body);
    return collection.toDetailsDto();
  }

  @Get()
  @RequirePermission(Permission.COLLECTION_READ)
  @ApiOperation({
    summary: 'List collections',
    operationId: 'listCollections',
  })
  @ApiOkResponse({ type: ListCollectionsResponseDto })
  async listCollections(@Query() query: ListCollectionsQueryDto) {
    const entities = await this.collectionService.listCollections(query);
    const dtos = await Promise.all(entities.map((entity) => entity.toDto()));
    return new ListCollectionsResponseDto({
      items: dtos,
      path: '/media/collections',
      query,
    });
  }

  @Get(':id')
  @RequirePermission(Permission.COLLECTION_READ)
  @ApiOperation({
    summary: 'Get a collection',
    operationId: 'getCollection',
  })
  @ApiOkResponse({ type: CollectionDetailsDto })
  @ApiCollectionNotFoundResponse()
  async getCollection(@Param('id') id: string) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    return collection.toDetailsDto();
  }

  @Patch(':id')
  @RequirePermission(Permission.COLLECTION_UPDATE)
  @ApiOperation({
    summary: 'Update a collection',
    operationId: 'updateCollection',
  })
  @ApiOkResponse({ type: CollectionDetailsDto })
  @ApiCollectionNotFoundResponse()
  async updateCollection(
    @Param('id') id: string,
    @Body() body: UpdateCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    await collection.update(body);
    return collection.toDetailsDto();
  }

  @Delete(':id')
  @RequirePermission(Permission.COLLECTION_DELETE)
  @ApiOperation({
    summary: 'Delete a collection',
    operationId: 'deleteCollection',
    description:
      'Soft deletes a collection by default. Pass permanently=true in body to permanently delete.',
  })
  @ApiOkResponse({ description: 'The collection was deleted' })
  async deleteCollection(@Param('id') id: string) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    await collection.delete();
  }

  @Delete(':id/containers')
  @RequirePermission(Permission.COLLECTION_UPDATE)
  @ApiOperation({
    summary: 'Remove media containers from a collection',
    operationId: 'removeContainersFromCollection',
  })
  @ApiOkResponse({
    description: 'The media containers were removed from the collection',
  })
  @ApiCollectionNotFoundResponse()
  async removeContainersFromCollection(
    @Param('id') id: string,
    @Body() body: RemoveContainersFromCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    await collection.removeMediaContainers(body.containerIds);
  }
}
