import { Module } from '@nestjs/common';
import { EventModule } from '../event';
import { MediaModule } from '../media';
import { ClassifierListeners } from './classifier.listeners';
import { ClassifierService } from './classifier.service';
import { ClassificationProviderController } from './controllers/classification-provider.controller';
import { ClassifierController } from './controllers/classifier.controller';
import { ClassificationProviderService } from './services/classification-provider.service';

@Module({
  imports: [MediaModule, EventModule],
  controllers: [ClassifierController, ClassificationProviderController],
  providers: [
    ClassifierService,
    ClassificationProviderService,
    ClassifierListeners,
  ],
  exports: [ClassifierService],
})
export class ClassifierModule {}
