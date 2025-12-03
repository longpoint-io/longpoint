import { Permission } from '@longpoint/types';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { z } from 'zod';

export const permissionSetConstants = {
  MIN_LENGTH: 1,
};

export const permissionSetSchema = z
  .array(z.enum(Permission))
  .min(permissionSetConstants.MIN_LENGTH);

export const isPermissionSet = (permissions: Permission[]) => {
  return permissionSetSchema.safeParse(permissions).success;
};

export const IsPermissionSet = (validationOptions?: ValidationOptions) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isPermissionSet,
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = permissionSetSchema.safeParse(
            validationArguments.value
          ).error;
          return error?.message ?? 'Invalid permission set';
        },
      },
    });
  };
};
