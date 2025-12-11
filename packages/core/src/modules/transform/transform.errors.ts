import { apiErrorDoc, ResourceNotFound } from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';

export class TransformTemplateNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Transform template', id);
  }
}
export const transformTemplateNotFoundDoc = apiErrorDoc(
  new TransformTemplateNotFound('sajl1kih6emtwozh8y0zenkj')
);
export const ApiTransformTemplateNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'The transform template was not found',
      ...transformTemplateNotFoundDoc,
    })
  );

export class TransformerNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Transformer', id);
  }
}
export const transformerNotFoundDoc = apiErrorDoc(
  new TransformerNotFound('something/transformer')
);
export const ApiTransformerNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'The transformer was not found',
      ...transformerNotFoundDoc,
    })
  );
