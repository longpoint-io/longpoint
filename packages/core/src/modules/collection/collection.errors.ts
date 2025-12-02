import {
  apiErrorDoc,
  BaseError,
  ResourceAlreadyExists,
  ResourceNotFound,
} from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export class CollectionNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Collection', id, 'id');
  }
}
export const collectionNotFoundDoc = apiErrorDoc(
  new CollectionNotFound('mbjq36xe6397dsi6x9nq4ghc')
);
export const ApiCollectionNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Collection not found',
      ...collectionNotFoundDoc,
    })
  );
};

export class CollectionAlreadyDeleted extends BaseError {
  constructor(id: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Collection ${id} already deleted`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class CannotDeleteCollectionWithChildren extends BaseError {
  constructor(id: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Cannot delete collection ${id} because it has child collections`,
      HttpStatus.BAD_REQUEST,
      { collectionId: id }
    );
  }
}

export class CollectionAlreadyExists extends ResourceAlreadyExists {
  constructor(name: string) {
    super(`Collection with name "${name}" already exists`);
  }
}
export const collectionExistsDoc = apiErrorDoc(
  new CollectionAlreadyExists('My Collection')
);
export const ApiCollectionAlreadyExistsResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'The collection already exists',
      ...collectionExistsDoc,
    })
  );
