import { apiErrorDoc, BaseError, ResourceNotFound } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export class SearchIndexNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Search index', id, 'id');
  }
}
export const searchIndexNotFoundDoc = apiErrorDoc(
  new SearchIndexNotFound('r2qwyd76nvd98cu6ewg8ync2')
);
export const ApiSearchIndexNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Search index not found',
      ...searchIndexNotFoundDoc,
    })
  );
};

export class SearchProviderNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Search provider', id);
  }
}
export const searchProviderNotFoundDoc = apiErrorDoc(
  new SearchProviderNotFound('r2qwyd76nvd98cu6ewg8ync2')
);
export const ApiSearchProviderNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Search provider not found',
      ...searchProviderNotFoundDoc,
    })
  );
};

export class NativeEmbeddingNotSupported extends BaseError {
  constructor(searchProviderId: string) {
    super(
      ErrorCode.OPERATION_NOT_SUPPORTED,
      `Native embedding not supported for search provider '${searchProviderId}'. Please provider an embedding model ID to use for the index.`,
      HttpStatus.BAD_REQUEST,
      { searchProviderId }
    );
  }
}
export const nativeEmbeddingNotSupportedDoc = apiErrorDoc(
  new NativeEmbeddingNotSupported('r2qwyd76nvd98cu6ewg8ync2')
);
export const ApiNativeEmbeddingNotSupportedResponse = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Native embedding not supported for this search provider',
      ...nativeEmbeddingNotSupportedDoc,
    })
  );
};
