import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SdkTag } from '../types/swagger.types';

/**
 * Tag a controller with an SDK tag
 * @param name - The name of the SDK tag
 */
export const ApiSdkTag = (name: SdkTag) => {
  return applyDecorators(ApiTags(name));
};
