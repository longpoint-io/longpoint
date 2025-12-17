import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { TransformController as TransformTemplateController } from './controllers/transform-template.controller';
import { TransformerController } from './controllers/transformer.controller';
import { TransformTemplateService } from './services/transform-template.service';
import { TransformerService } from './services/transformer.service';

@Module({
  imports: [AssetModule],
  controllers: [TransformTemplateController, TransformerController],
  providers: [TransformTemplateService, TransformerService],
  exports: [TransformTemplateService],
})
export class TransformModule {}
