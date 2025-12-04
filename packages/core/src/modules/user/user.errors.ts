import {
  apiErrorDoc,
  ResourceAlreadyExists,
  ResourceNotFound,
} from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export class UserRegistrationNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('User registration', id);
  }
}
export const userRegistrationNotFoundDoc = apiErrorDoc(
  new UserRegistrationNotFound('fjsbfjksbfmsajl1kih6emtwozh')
);
export const ApiUserRegistrationNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'User registration not found',
      ...userRegistrationNotFoundDoc,
    })
  );

export class UserNotFound extends ResourceNotFound {
  constructor(id: string) {
    super('User', id);
  }
}
export const userNotFoundDoc = apiErrorDoc(
  new UserNotFound('fjsbfjksbfmsajl1kih6emtwozh')
);
export const ApiUserNotFoundResponse = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'User not found',
      ...userNotFoundDoc,
    })
  );

export class UserAlreadyExists extends ResourceAlreadyExists {
  constructor(email: string) {
    super(`User with email "${email}" already exists`);
  }
}
export const userAlreadyExistsDoc = apiErrorDoc(
  new UserAlreadyExists('john.doe@example.com')
);
export const ApiUserAlreadyExistsResponse = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'The user already exists',
      ...userAlreadyExistsDoc,
    })
  );
