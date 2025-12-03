import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services';
import { SetupStatusDto } from './dtos/setup-status.dto';
import { SystemStatusDto } from './dtos/system-status.dto';

@Injectable()
export class SystemService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSetupStatus() {
    const hasSuperAdmin = await this.prismaService.userRole.findFirst({
      where: {
        role: {
          name: {
            equals: 'Super Admin',
            mode: 'insensitive',
          },
        },
      },
      take: 1,
    });

    return new SetupStatusDto({ isFirstTimeSetup: !hasSuperAdmin });
  }

  async getSystemStatus() {
    const totalAssets = await this.prismaService.asset.count({
      where: {
        deletedAt: null,
        status: 'READY',
      },
    });

    return new SystemStatusDto({ totalAssets });
  }
}
