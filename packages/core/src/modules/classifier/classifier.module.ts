import { Module, forwardRef } from '@nestjs/common';
import { AssetModule } from '../asset';
import { EventModule } from '../event';
import { ClassifierTemplateController } from './controllers/classifier-template.controller';
import { ClassifierController } from './controllers/classifier.controller';
import { ClassifierTemplateService } from './services/classifier-template.service';
import { ClassifierService } from './services/classifier.service';

@Module({
  imports: [forwardRef(() => AssetModule), EventModule],
  controllers: [ClassifierController, ClassifierTemplateController],
  providers: [ClassifierService, ClassifierTemplateService],
  exports: [ClassifierService, ClassifierTemplateService],
})
export class ClassifierModule {}
