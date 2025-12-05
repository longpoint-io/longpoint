import { BaseError } from '@/shared/errors';
import { DEFAULT_ROLES, ErrorCode } from '@longpoint/types';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AssetNotFound, AssetNotReady } from '../asset';
import { AssetLinkGeneratorService } from '../asset/services/asset-link-generator.service';
import { PrismaService } from '../common/services';
import { UpdateSystemSettingsDto } from './dtos';
import { SetupStatusDto } from './dtos/setup-status.dto';
import { SystemStatusDto } from './dtos/system-status.dto';

@Injectable()
export class SystemService {
  private readonly systemSettingsId = 'system-settings';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly assetLinkGeneratorService: AssetLinkGeneratorService
  ) {}

  async getSetupStatus() {
    const hasSuperAdmin = await this.prismaService.user.findFirst({
      where: {
        roles: {
          some: {
            name: DEFAULT_ROLES.superAdmin.name,
          },
        },
      },
      take: 1,
    });

    return new SetupStatusDto({ isFirstTimeSetup: !hasSuperAdmin });
  }

  async getSystemStatus() {
    const settings = await this.getOrCreateSettings();
    let logoUrl: string | null = null;

    if (settings?.logoAssetId) {
      const links = await this.assetLinkGeneratorService.generateLinks({
        assets: [
          { assetId: settings.logoAssetId, w: 150, h: 150, fit: 'cover' },
        ],
      });
      logoUrl = links[settings.logoAssetId];
    }

    const totalAssets = await this.prismaService.asset.count({
      where: {
        deletedAt: null,
        status: 'READY',
      },
    });

    return new SystemStatusDto({ name: settings.name, logoUrl, totalAssets });
  }

  async updateSystemSettings(body: UpdateSystemSettingsDto) {
    await this.prismaService.$transaction(async (tx) => {
      const updateData: {
        name?: string;
        logoAssetId?: string;
      } = {};

      if (body.name !== undefined) {
        updateData.name = body.name;
      }

      if (body.logoAssetId) {
        const asset = await tx.asset.findUnique({
          where: {
            id: body.logoAssetId,
          },
          select: {
            status: true,
            type: true,
          },
        });

        if (!asset) {
          throw new AssetNotFound(body.logoAssetId);
        }

        if (asset.status !== 'READY') {
          throw new AssetNotReady(body.logoAssetId);
        }

        if (asset.type !== 'IMAGE') {
          throw new BaseError(
            ErrorCode.INVALID_INPUT,
            'Asset is not an image type',
            HttpStatus.BAD_REQUEST
          );
        }

        updateData.logoAssetId = body.logoAssetId;
      }

      if (Object.keys(updateData).length > 0) {
        const existingSettings = await tx.systemSettings.findUnique({
          where: {
            id: this.systemSettingsId,
          },
        });

        if (existingSettings) {
          await tx.systemSettings.update({
            where: {
              id: this.systemSettingsId,
            },
            data: updateData,
          });
        } else {
          await tx.systemSettings.create({
            data: {
              id: this.systemSettingsId,
              ...updateData,
            },
          });
        }
      }
    });
    return this.getSystemStatus();
  }

  private async getOrCreateSettings() {
    const settings = await this.prismaService.systemSettings.findUnique({
      where: {
        id: this.systemSettingsId,
      },
    });
    if (settings) {
      return settings;
    }
    return this.prismaService.systemSettings.create({
      data: {},
    });
  }
}
