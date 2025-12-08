import { Module } from '@nestjs/common';
import { StorageModule } from '../storage';
import { FileDeliveryController } from './file-delivery.controller';
import { FileDeliveryService } from './services/file-delivery.service';
import { ImageTransformService } from './services/image-transform.service';
import { UrlSigningService } from './services/url-signing.service';

@Module({
  imports: [StorageModule],
  controllers: [FileDeliveryController],
  providers: [FileDeliveryService, ImageTransformService, UrlSigningService],
  exports: [UrlSigningService],
})
export class FileDeliveryModule {}
