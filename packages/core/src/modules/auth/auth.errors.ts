import { BaseError } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { HttpStatus } from '@nestjs/common';

export class InvalidRegistrationToken extends BaseError {
  constructor() {
    super(
      ErrorCode.INVALID_AUTHORIZATION,
      'Invalid registration token. Please request a new signup link.',
      HttpStatus.UNAUTHORIZED
    );
  }
}
