import { apiErrorDoc, BaseError, ResourceNotFound } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export class PluginNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Plugin', id);
  }
}

export const pluginNotFoundDoc = apiErrorDoc(
  new PluginNotFound('example-plugin-id')
);

export const ApiPluginNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Plugin not found',
      ...pluginNotFoundDoc,
    })
  );
};

export class CannotModifyPluginTemplate extends BaseError {
  constructor() {
    super(
      ErrorCode.OPERATION_NOT_SUPPORTED,
      'Plugin-defined templates cannot be modified',
      HttpStatus.BAD_REQUEST
    );
  }
}
export const cannotUpdatePluginTemplateDoc = apiErrorDoc(
  new CannotModifyPluginTemplate()
);
export const ApiCannotModifyPluginTemplateResponse = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Cannot update plugin-defined templates',
      ...cannotUpdatePluginTemplateDoc,
    })
  );
};
