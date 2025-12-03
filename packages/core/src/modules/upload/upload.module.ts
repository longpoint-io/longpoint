import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { ClassifierModule } from '../classifier';
import { EventModule } from '../event';
import { FileDeliveryModule } from '../file-delivery';
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
