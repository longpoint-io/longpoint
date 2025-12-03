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
import { ApiCollectionNotFoundResponse } from './collection.errors';
import { CollectionService } from './collection.service';
import {
  AddAssetsToCollectionDto,
  CollectionDetailsDto,
  CollectionDto,
  CreateCollectionDto,
  ListCollectionsQueryDto,
  ListCollectionsResponseDto,
  RemoveAssetsFromCollectionDto,
  UpdateCollectionDto,
} from './dtos';

@Controller('collections')
@ApiSdkTag(SdkTag.Collections)
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
      path: '/collections',
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

  @Post(':id/assets')
  @RequirePermission(Permission.COLLECTION_UPDATE)
  @ApiOperation({
    summary: 'Add assets to a collection',
    operationId: 'addAssetsToCollection',
  })
  @ApiOkResponse({
    description: 'The assets were added to the collection',
  })
  @ApiCollectionNotFoundResponse()
  async addAssetsToCollection(
    @Param('id') id: string,
    @Body() body: AddAssetsToCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    await collection.addAssets(body.assetIds);
  }

  @Delete(':id/assets')
  @RequirePermission(Permission.COLLECTION_UPDATE)
  @ApiOperation({
    summary: 'Remove assets from a collection',
    operationId: 'removeAssetsFromCollection',
  })
  @ApiOkResponse({
    description: 'The assets were removed from the collection',
  })
  @ApiCollectionNotFoundResponse()
  async removeAssetsFromCollection(
    @Param('id') id: string,
    @Body() body: RemoveAssetsFromCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      id
    );
    await collection.removeAssets(body.assetIds);
  }
}
