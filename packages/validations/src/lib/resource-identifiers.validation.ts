import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import z from 'zod';
import { isSlug, slugConstants } from './generic/slug.validation.js';

export const constants = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500,
};

export const nameSchema = z
  .string()
  .min(constants.MIN_NAME_LENGTH)
  .max(constants.MAX_NAME_LENGTH)
  .refine(isSlug, {
    error: slugConstants.SLUG_ERROR_MESSAGE,
  });

export const isResourceName = (name: string) => {
  return nameSchema.safeParse(name).success;
};

export const IsResourceName = (
  resourceType: string,
  validationOptions?: ValidationOptions
) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isResourceName,
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = nameSchema.safeParse(validationArguments.value).error;
          return error?.message ?? `Invalid ${resourceType} name`;
        },
      },
    });
  };
};

export const displayNameSchema = z
  .string()
  .min(constants.MIN_NAME_LENGTH)
  .max(constants.MAX_NAME_LENGTH)
  .optional();

export const isDisplayName = (displayName: string | undefined) => {
  return displayNameSchema.safeParse(displayName).success;
};

export const IsDisplayName = (
  resourceType: string,
  validationOptions?: ValidationOptions
) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isDisplayName,
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = displayNameSchema.safeParse(
            validationArguments.value
          ).error;
          return error?.message ?? `Invalid ${resourceType} display name`;
        },
      },
    });
  };
};

export const descriptionSchema = z
  .string()
  .max(constants.MAX_DESCRIPTION_LENGTH)
  .optional();

export const isResourceDescription = (description: string | undefined) => {
  return descriptionSchema.safeParse(description).success;
};

export const IsResourceDescription = (
  resourceType: string,
  validationOptions?: ValidationOptions
) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: isResourceDescription,
        defaultMessage: (validationArguments: ValidationArguments) => {
          const error = descriptionSchema.safeParse(
            validationArguments.value
          ).error;
          return error?.message ?? `Invalid ${resourceType} description`;
        },
      },
    });
  };
};
