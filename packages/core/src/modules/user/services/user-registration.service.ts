import { Prisma } from '@/database';
import { BaseError } from '@/shared/errors';
import { ErrorCode } from '@longpoint/types';
import { HttpStatus, Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { addDays } from 'date-fns';
import { ConfigService, PrismaService } from '../../common/services';
import { CreateUserRegistrationDto } from '../dtos';
import { UserRegistrationNotFound } from '../user.errors';
import { selectUserRegistration } from '../user.selectors';

@Injectable()
export class UserRegistrationService {
  private readonly registrationTokenExpirationDays = 7;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async createUserRegistration(body: CreateUserRegistrationDto) {
    const registration = await this.prismaService.$transaction(async (tx) => {
      const deduplicatedRoleIds = Array.from(new Set(body.roleIds));
      const roles = await tx.role.findMany({
        where: {
          id: {
            in: deduplicatedRoleIds,
          },
        },
      });

      if (roles.length !== deduplicatedRoleIds.length) {
        const missingRoleIds = deduplicatedRoleIds.filter(
          (id) => !roles.some((role) => role.id === id)
        );
        throw new BaseError(
          ErrorCode.INVALID_INPUT,
          'One or more roles were not found',
          HttpStatus.BAD_REQUEST,
          { missingRoleIds }
        );
      }

      const tokenData = {
        token: crypto.randomBytes(32).toString('hex'),
        email: body.email,
        roles: {
          connect: roles.map((role) => ({ id: role.id })),
        },
        expiresAt: addDays(new Date(), this.registrationTokenExpirationDays),
      };

      return tx.userRegistration.upsert({
        where: {
          email: body.email,
        },
        update: tokenData,
        create: tokenData,
        select: {
          token: true,
        },
      });
    });

    return {
      token: registration.token,
      registrationUrl: `${this.configService.get(
        'server.dashboardUrl'
      )}/sign-up?token=${registration.token}`,
    };
  }

  async listUserRegistrations() {
    return this.prismaService.userRegistration.findMany({
      select: selectUserRegistration(),
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
    });
  }

  async getUserRegistrationByTokenOrThrow(token: string) {
    const userRegistration =
      await this.prismaService.userRegistration.findUnique({
        where: { token },
        select: selectUserRegistration(),
      });
    if (!userRegistration) {
      throw new UserRegistrationNotFound(token);
    }
    return userRegistration;
  }

  async revokeUserRegistration(userRegistrationId: string) {
    try {
      await this.prismaService.userRegistration.delete({
        where: {
          id: userRegistrationId,
        },
      });
    } catch (error) {
      if (PrismaService.isNotFoundError(error)) {
        throw new UserRegistrationNotFound(userRegistrationId);
      }
      throw error;
    }
  }
}
