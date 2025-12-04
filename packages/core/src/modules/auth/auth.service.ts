import { Unexpected } from '@/shared/errors';
import { DEFAULT_ROLES } from '@longpoint/types';
import { Injectable, Logger } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware } from 'better-auth/api';
import { toNodeHandler } from 'better-auth/node';
import { isAfter } from 'date-fns';
import { Request, Response } from 'express';
import { ConfigService, PrismaService } from '../common/services';
import { InvalidRegistrationToken } from './auth.errors';

type BetterAuthMiddlewareContext = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly betterAuth: ReturnType<typeof betterAuth>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService
  ) {
    this.betterAuth = this.initializeBetterAuth();
  }

  handleAuthRequest(req: Request, res: Response) {
    return toNodeHandler(this.betterAuth)(req, res);
  }

  /**
   * Perform pre-signup validation for the first user and registration token.
   * @param ctx
   * @returns void
   */
  private async beforeSignUp(ctx: BetterAuthMiddlewareContext): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      if (userCount === 0) {
        return; // first user doesn't need a registration token
      }

      const userRegistration = await tx.userRegistration.findUnique({
        where: {
          token: ctx.query?.token ?? '',
        },
        select: {
          id: true,
          email: true,
          expiresAt: true,
        },
      });

      if (!userRegistration) {
        this.logger.log('Missing registration token', {
          token: ctx.query?.token,
        });
        throw new InvalidRegistrationToken();
      }

      if (userRegistration.email !== ctx.body.email) {
        this.logger.log('Registration token email mismatch', {
          token: ctx.query?.token,
          tokenEmail: userRegistration.email,
          requestEmail: ctx.body.email,
        });
        throw new InvalidRegistrationToken();
      }

      const tokenExpired = isAfter(new Date(), userRegistration.expiresAt);
      if (tokenExpired) {
        this.logger.log('Registration token expired', {
          token: ctx.query?.token,
        });
        throw new InvalidRegistrationToken();
      }

      return;
    });
  }

  /**
   * Perform post-signup actions for the first user and assign the Super Admin role.
   * @param ctx
   * @returns void
   */
  private async afterSignUp(ctx: BetterAuthMiddlewareContext): Promise<void> {
    const newSession = ctx.context.newSession;
    if (!newSession) {
      this.logger.warn(
        'Expected a new session after signup, but none was found! Post-signup hooks will not be executed.'
      );
      return;
    }

    await this.prismaService.$transaction(async (tx) => {
      const userCount = await tx.user.count();
      if (userCount === 1) {
        const superAdminRole = await tx.role.findFirst({
          where: {
            name: {
              equals: DEFAULT_ROLES.superAdmin.name,
              mode: 'insensitive',
            },
          },
        });
        if (!superAdminRole) {
          throw new Error('Expected Super Admin role - not found');
        }
        await tx.user.update({
          where: {
            id: newSession.user.id,
          },
          data: {
            roles: {
              connect: {
                id: superAdminRole.id,
              },
            },
          },
        });
      } else {
        const registration = await tx.userRegistration.findUnique({
          where: {
            email: ctx.body.email,
          },
          select: {
            id: true,
            roles: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!registration) {
          throw new Unexpected(
            'Expected a registration for the user, but none was found'
          );
        }

        await tx.user.update({
          where: {
            id: newSession.user.id,
          },
          data: {
            roles: {
              connect: registration.roles.map((role) => ({ id: role.id })),
            },
          },
        });

        await tx.userRegistration.delete({
          where: {
            id: registration.id,
          },
        });
      }
    });
  }

  private async addPermissionsToSession(ctx: BetterAuthMiddlewareContext) {
    const user = ctx.context.session?.user;
    if (user) {
      const rolePermissions = await this.prismaService.rolePermission.findMany({
        where: {
          role: {
            users: {
              some: {
                id: user.id,
              },
            },
          },
        },
        select: {
          permission: true,
        },
      });
      user['permissions'] = rolePermissions.reduce((acc, permission) => {
        acc[permission.permission] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
  }

  private initializeBetterAuth() {
    const logger = this.logger;
    return betterAuth({
      appName: 'Longpoint',

      database: prismaAdapter(this.prismaService, {
        provider: 'postgresql',
      }),
      emailAndPassword: {
        enabled: true,
      },
      baseURL: this.configService.get('server.origin'), // better-auth expects the origin, not including the path
      trustedOrigins: this.configService.get('server.corsOrigins'),
      secret: this.configService.get('auth.secret'),
      telemetry: {
        enabled: false,
      },
      // session: {
      //   cookieCache: {
      //     enabled: true,
      //   },
      // },
      user: {
        additionalFields: {
          something: {
            type: 'string',
            input: false,
          },
        },
      },
      advanced: {
        cookiePrefix: 'longpoint',
      },
      hooks: {
        before: createAuthMiddleware(async (ctx) => {
          const isSignUp = ctx.path.startsWith('/sign-up');
          if (isSignUp) {
            await this.beforeSignUp(ctx);
          }
        }),
        after: createAuthMiddleware(async (ctx) => {
          const isSignUp = ctx.path.startsWith('/sign-up');
          if (isSignUp) {
            await this.afterSignUp(ctx);
          }

          const isGetSession = ctx.path.startsWith('/get-session');
          if (isGetSession) {
            const user = ctx.context.session?.user;
            if (user) {
              await this.addPermissionsToSession(ctx);
            }
          }
        }),
      },
      logger: {
        log(level, message, ...args) {
          switch (level) {
            case 'error':
              logger.error(message, ...args);
              break;
            case 'warn':
              logger.warn(message, ...args);
              break;
            case 'info':
              logger.log(message, ...args);
              break;
            case 'debug':
              logger.debug(message, ...args);
              break;
            default:
              logger.log(message, ...args);
              break;
          }
        },
      },
    });
  }
}
