import { length, registerDecorator, ValidationOptions } from 'class-validator';

export const assetNameConstants = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
};

export const isValidAssetName = (name: string) => {
  return length(
    name,
    assetNameConstants.MIN_NAME_LENGTH,
    assetNameConstants.MAX_NAME_LENGTH
  );
};

export const IsValidAssetName = (
  validationOptions?: ValidationOptions
) => {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: isValidAssetName },
    });
  };
};
