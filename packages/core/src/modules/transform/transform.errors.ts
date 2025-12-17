import { apiErrorDoc, ResourceNotFound } from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';

export class TransformerTemplateNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Transformer template', id);
  }
}
export const transformerTemplateNotFoundDoc = apiErrorDoc(
  new TransformerTemplateNotFound('sajl1kih6emtwozh8y0zenkj')
);
export const ApiTransformerTemplateNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'The transformer template was not found',
      ...transformerTemplateNotFoundDoc,
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
