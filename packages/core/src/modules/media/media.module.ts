import { Module } from '@nestjs/common';
import { MediaProbeService } from '../common/services/media-probe/media-probe.service';
import { EventModule } from '../event';
import { FileDeliveryModule } from '../file-delivery';
import { StorageModule } from '../storage';
import { MediaContainerController } from './controllers/media-container.controller';
import { MediaLinkGeneratorController } from './controllers/media-link-generator.controller';
import { MediaTreeController } from './controllers/media-tree.controller';
import { MediaMetadataListeners } from './listeners/media-metadata.listeners';
import { MediaContainerService } from './services/media-container.service';
import { MediaLinkGeneratorService } from './services/media-link-generator.service';
import { MediaTreeService } from './services/media-tree.service';

@Module({
  imports: [StorageModule, FileDeliveryModule, EventModule],
  controllers: [
    MediaContainerController,
    MediaTreeController,
    MediaLinkGeneratorController,
  ],
  providers: [
    MediaContainerService,
    MediaProbeService,
    MediaTreeService,
    MediaLinkGeneratorService,
    MediaMetadataListeners,
  ],
  exports: [MediaContainerService],
})
export class MediaModule {}
