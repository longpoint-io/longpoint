import { Module, forwardRef } from '@nestjs/common';
import { AssetModule } from '../asset';
import { EventModule } from '../event';
import { ClassifierListeners } from './classifier.listeners';
import { ClassifierService } from './classifier.service';
import { ClassificationProviderController } from './controllers/classification-provider.controller';
import { ClassifierController } from './controllers/classifier.controller';
import { ClassificationProviderService } from './services/classification-provider.service';

@Module({
  imports: [forwardRef(() => AssetModule), EventModule],
  controllers: [ClassifierController, ClassificationProviderController],
  providers: [
    ClassifierService,
    ClassificationProviderService,
    ClassifierListeners,
  ],
  exports: [ClassifierService],
})
export class ClassifierModule {}
