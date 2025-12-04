import { PrismaService } from '@/modules/common/services';
import { selectUser } from '@/modules/user/user.selectors';
import { PUBLIC_METADATA_KEY } from '@/shared/decorators';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isAfter } from 'date-fns';
import { Request } from 'express';
import { InvalidAuthorization } from '../app.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPublic) {
      // Still try to validate the session token even if the endpoint is public
      try {
        const bearerToken = this.getAuthToken(request);
        await this.validateSessionToken(bearerToken, request);
      } catch (e) {
        if (!(e instanceof InvalidAuthorization)) {
          throw e;
        }
        // It's okay if the session token is invalid since it's a public endpoint
      }
      return true;
    }

    const authToken = this.getAuthToken(request);
    await this.validateSessionToken(authToken, request);

    return true;
  }

  private async validateSessionToken(bearerToken: string, request: Request) {
    const token = this.parseSessionToken(bearerToken);

    const session = await this.prismaService.session.findUnique({
      where: {
        token,
      },
      select: {
        expiresAt: true,
        user: {
          select: selectUser(),
        },
      },
    });

    if (!session) {
      throw new InvalidAuthorization();
    }

    if (isAfter(new Date(), session.expiresAt)) {
      await this.prismaService.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      throw new InvalidAuthorization();
    }

    request.user = session.user;
  }

  private parseSessionToken(bearerToken: string) {
    const prefix = 'sess_';

    if (bearerToken.startsWith(prefix)) {
      const withoutPrefix = bearerToken.substring(prefix.length);
      const token = withoutPrefix.split('.')[0];
      if (token) {
        return token;
      }
    }

    throw new InvalidAuthorization();
  }

  private getAuthToken(request: Request) {
    const [authType, bearerToken] =
      request.headers.authorization?.split(' ') ?? [];

    if (authType !== 'Bearer') {
      throw new InvalidAuthorization();
    }

    return bearerToken;
  }
}
