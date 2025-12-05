import { Module } from '@nestjs/common';
import { MediaProbeService } from '../common/services/media-probe/media-probe.service';
import { EventModule } from '../event';
import { FileDeliveryModule } from '../file-delivery';
import { StorageModule } from '../storage';
import { MediaMetadataListeners } from './asset.listeners';
import { AssetLinkGeneratorController } from './controllers/asset-link-generator.controller';
import { AssetController } from './controllers/asset.controller';
import { AssetLinkGeneratorService } from './services/asset-link-generator.service';
import { AssetService } from './services/asset.service';

@Module({
  imports: [StorageModule, FileDeliveryModule, EventModule],
  controllers: [AssetController, AssetLinkGeneratorController],
  providers: [
    AssetService,
    MediaProbeService,
    AssetLinkGeneratorService,
    MediaMetadataListeners,
  ],
  exports: [AssetService, AssetLinkGeneratorService],
})
export class AssetModule {}
