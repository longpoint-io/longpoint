import { apiErrorDoc, ResourceNotFound } from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';

export class RuleNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('Rule', id);
  }
}

export const ruleNotFoundDoc = apiErrorDoc(
  new RuleNotFound('ukt4084q1kaqmsq74f2fxg43')
);

export const ApiRuleNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'The rule was not found',
      ...ruleNotFoundDoc,
    })
  );


