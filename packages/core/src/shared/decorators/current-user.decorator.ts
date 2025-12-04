import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Assign the request user to the decorated parameter.
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
