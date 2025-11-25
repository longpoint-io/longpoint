import { apiErrorDoc, BaseError, ResourceNotFound } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';

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

