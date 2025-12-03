import { Module } from '@nestjs/common';
import { ClassifierModule } from '../classifier';
import { EventModule } from '../event';
import { FileDeliveryModule } from '../file-delivery';
import { AssetModule } from '../media';
import { StorageModule } from '../storage';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    ClassifierModule,
    AssetModule,
    FileDeliveryModule,
    StorageModule,
    EventModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
