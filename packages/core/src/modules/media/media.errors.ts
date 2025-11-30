import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import {
  apiErrorDoc,
  BaseError,
  ResourceAlreadyExists,
  ResourceNotFound,
} from '../../shared/errors';

export class MediaContainerNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Media container', id, 'id');
  }
}
export const mediaContainerNotFoundDoc = apiErrorDoc(
  new MediaContainerNotFound('mbjq36xe6397dsi6x9nq4ghc')
);
export const ApiMediaContainerNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Media container not found',
      ...mediaContainerNotFoundDoc,
    })
  );
};

export class MediaAssetNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Media asset', id, 'id');
  }
}
export const mediaAssetNotFoundDoc = apiErrorDoc(
  new MediaAssetNotFound('vhsqjb87mm16c32817qh1wa8')
);
export const ApiMediaAssetNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Media asset not found',
      ...mediaAssetNotFoundDoc,
    })
  );
};

export class MediaContainerAlreadyExists extends ResourceAlreadyExists {
  constructor(name: string) {
    super(`Media container with name "${name}" already exists`);
  }
}
export const mediaContainerExistsDoc = apiErrorDoc(
  new MediaContainerAlreadyExists('My Container')
);
export const ApiMediaContainerAlreadyExistsResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'The media container already exists',
      ...mediaContainerExistsDoc,
    })
  );

export class MediaContainerAlreadyDeleted extends BaseError {
  constructor(id: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Media container ${id} already deleted`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class MediaContainerNotEmbeddable extends BaseError {
  constructor(mediaContainerId: string) {
    super(
      ErrorCode.OPERATION_NOT_SUPPORTED,
      `Media container ${mediaContainerId} is not currently embeddable, due to the primary asset not being ready`,
      HttpStatus.BAD_REQUEST,
      { mediaContainerId }
    );
  }
}

export class TreePathNotFound extends BaseError {
  constructor(path: string) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      `Tree path not found: ${path}`,
      HttpStatus.NOT_FOUND
    );
  }
}

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
