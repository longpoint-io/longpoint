import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import {
  apiErrorDoc,
  BaseError,
  ResourceAlreadyExists,
  ResourceNotFound,
} from '../../shared/errors';

export class AssetNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Asset', id, 'id');
  }
}
export const assetNotFoundDoc = apiErrorDoc(
  new AssetNotFound('mbjq36xe6397dsi6x9nq4ghc')
);
export const ApiAssetNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Asset not found',
      ...assetNotFoundDoc,
    })
  );
};

export class AssetVariantNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Asset variant', id, 'id');
  }
}
export const assetVariantNotFoundDoc = apiErrorDoc(
  new AssetVariantNotFound('vhsqjb87mm16c32817qh1wa8')
);
export const ApiAssetVariantNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Asset variant not found',
      ...assetVariantNotFoundDoc,
    })
  );
};

export class AssetAlreadyExists extends ResourceAlreadyExists {
  constructor(name: string) {
    super(`Asset with name "${name}" already exists`);
  }
}
export const assetExistsDoc = apiErrorDoc(new AssetAlreadyExists('My Asset'));
export const ApiAssetAlreadyExistsResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'The asset already exists',
      ...assetExistsDoc,
    })
  );

export class AssetAlreadyDeleted extends BaseError {
  constructor(id: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Asset ${id} already deleted`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AssetNotReady extends BaseError {
  constructor(id: string) {
    super(
      ErrorCode.INVALID_INPUT,
      `Asset ${id} is not ready for use`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class AssetNotEmbeddable extends BaseError {
  constructor(assetId: string) {
    super(
      ErrorCode.OPERATION_NOT_SUPPORTED,
      `Asset ${assetId} is not currently embeddable, due to the primary variant not being ready`,
      HttpStatus.BAD_REQUEST,
      { assetId }
    );
  }
}
