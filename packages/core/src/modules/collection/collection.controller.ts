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
  @RequirePermission(Permission.COLLECTIONS_CREATE)
  @ApiOperation({
    summary: 'Create a collection',
    operationId: 'collections.create',
    description: 'Creates a new collection for grouping assets.',
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
  @RequirePermission(Permission.COLLECTIONS_READ)
  @ApiOperation({
    summary: 'List collections',
    operationId: 'collections.list',
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

  @Get(':collectionId')
  @RequirePermission(Permission.COLLECTIONS_READ)
  @ApiOperation({
    summary: 'Get a collection',
    operationId: 'collections.get',
  })
  @ApiOkResponse({ type: CollectionDetailsDto })
  @ApiCollectionNotFoundResponse()
  async getCollection(@Param('collectionId') collectionId: string) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      collectionId
    );
    return collection.toDetailsDto();
  }

  @Patch(':collectionId')
  @RequirePermission(Permission.COLLECTIONS_UPDATE)
  @ApiOperation({
    summary: 'Update a collection',
    operationId: 'collections.update',
  })
  @ApiOkResponse({ type: CollectionDetailsDto })
  @ApiCollectionNotFoundResponse()
  async updateCollection(
    @Param('collectionId') collectionId: string,
    @Body() body: UpdateCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      collectionId
    );
    await collection.update(body);
    return collection.toDetailsDto();
  }

  @Delete(':collectionId')
  @RequirePermission(Permission.COLLECTIONS_DELETE)
  @ApiOperation({
    summary: 'Delete a collection',
    operationId: 'collections.delete',
    description:
      'Soft deletes a collection by default. Pass permanently=true in body to permanently delete.',
  })
  @ApiOkResponse({ description: 'The collection was deleted' })
  async deleteCollection(@Param('collectionId') collectionId: string) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      collectionId
    );
    await collection.delete();
  }

  @Post(':collectionId/assets')
  @RequirePermission(Permission.COLLECTIONS_UPDATE)
  @ApiOperation({
    summary: 'Add assets to a collection',
    operationId: 'collections.addAssets',
  })
  @ApiOkResponse({
    description: 'The assets were added to the collection',
  })
  @ApiCollectionNotFoundResponse()
  async addAssetsToCollection(
    @Param('collectionId') collectionId: string,
    @Body() body: AddAssetsToCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      collectionId
    );
    await collection.addAssets(body.assetIds);
  }

  @Delete(':collectionId/assets')
  @RequirePermission(Permission.COLLECTIONS_UPDATE)
  @ApiOperation({
    summary: 'Remove assets from a collection',
    operationId: 'collections.removeAssets',
  })
  @ApiOkResponse({
    description: 'The assets were removed from the collection',
  })
  @ApiCollectionNotFoundResponse()
  async removeAssetsFromCollection(
    @Param('collectionId') collectionId: string,
    @Body() body: RemoveAssetsFromCollectionDto
  ) {
    const collection = await this.collectionService.getCollectionByIdOrThrow(
      collectionId
    );
    await collection.removeAssets(body.assetIds);
  }
}
