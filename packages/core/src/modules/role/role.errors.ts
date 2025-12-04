import {
  apiErrorDoc,
  ResourceAlreadyExists,
  ResourceNotFound,
} from '@/shared/errors';
import { applyDecorators } from '@nestjs/common';
import { ApiConflictResponse, ApiNotFoundResponse } from '@nestjs/swagger';

export class RoleNotFoundError extends ResourceNotFound {
  constructor(id: string) {
    super('Role', id);
  }
}
export const roleNotFoundErrorDoc = apiErrorDoc(
  new RoleNotFoundError('r2qwyd76nvd98cu6ewg8ync2')
);
export const ApiRoleNotFoundResponse = () => {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Role not found',
      ...roleNotFoundErrorDoc,
    })
  );
};

export class RoleAlreadyExists extends ResourceAlreadyExists {
  constructor(name: string) {
    super(`Role with name '${name}' already exists`);
  }
}
export const roleAlreadyExistsDoc = apiErrorDoc(
  new RoleAlreadyExists('My Role')
);
export const ApiRoleAlreadyExistsResponse = () => {
  return applyDecorators(
    ApiConflictResponse({
      description: 'Role already exists',
      ...roleAlreadyExistsDoc,
    })
  );
};
