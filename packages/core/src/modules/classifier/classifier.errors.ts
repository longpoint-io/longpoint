import { apiErrorDoc, ResourceNotFound } from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';

export class ClassifierNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Classifier', id);
  }
}
export const classifierNotFoundDoc = apiErrorDoc(
  new ClassifierNotFound('ukt4084q1kaqmsq74f2fxg43')
);
export const ApiClassifierNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'The classifier was not found',
      ...classifierNotFoundDoc,
    })
  );

export class ClassificationProviderNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('ClassificationProvider', id);
  }
}
