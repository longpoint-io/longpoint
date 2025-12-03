import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import z from 'zod';

export const roleConstants = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500,
};

export const roleNameSchema = z
  .string()
  .min(roleConstants.MIN_NAME_LENGTH)
  .max(roleConstants.MAX_NAME_LENGTH);

export const roleDescriptionSchema = z
  .string()
  .max(roleConstants.MAX_DESCRIPTION_LENGTH)
  .optional();

export const isRoleName = (name: string) => {
  return roleNameSchema.safeParse(name).success;
};

export const isRoleDescription = (description: string | undefined) => {
  return roleDescriptionSchema.safeParse(description).success;
};

export const IsRoleName = (validationOptions?: ValidationOptions) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isRoleName,
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = roleNameSchema.safeParse(
            validationArguments.value
          ).error;
          return error?.message ?? 'Invalid role name';
        },
      },
    });
  };
};

export const IsRoleDescription = (validationOptions?: ValidationOptions) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: any) => {
          return isRoleDescription(value);
        },
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = roleDescriptionSchema.safeParse(
            validationArguments.value
          ).error;
          return error?.message ?? 'Invalid role description';
        },
      },
    });
  };
};
