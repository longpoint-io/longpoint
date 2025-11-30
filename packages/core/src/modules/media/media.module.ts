import { Module } from '@nestjs/common';
import { MediaProbeService } from '../common/services/media-probe/media-probe.service';
import { EventModule } from '../event';
import { FileDeliveryModule } from '../file-delivery';
import { StorageModule } from '../storage';
import { CollectionController } from './controllers/collection.controller';
import { MediaContainerController } from './controllers/media-container.controller';
import { MediaLinkGeneratorController } from './controllers/media-link-generator.controller';
import { MediaMetadataListeners } from './listeners/media-metadata.listeners';
import { CollectionService } from './services/collection.service';
import { MediaContainerService } from './services/media-container.service';
import { MediaLinkGeneratorService } from './services/media-link-generator.service';

@Module({
  imports: [StorageModule, FileDeliveryModule, EventModule],
  controllers: [
    MediaContainerController,
    CollectionController,
    MediaLinkGeneratorController,
  ],
  providers: [
    MediaContainerService,
    CollectionService,
    MediaProbeService,
    MediaLinkGeneratorService,
    MediaMetadataListeners,
  ],
  exports: [MediaContainerService, CollectionService],
})
export class MediaModule {}
