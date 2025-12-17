import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { TransformerTemplateController } from './controllers/transformer-template.controller';
import { TransformerController } from './controllers/transformer.controller';
import { TransformerTemplateService } from './services/transformer-template.service';
import { TransformerService } from './services/transformer.service';

@Module({
  imports: [AssetModule],
  controllers: [TransformerTemplateController, TransformerController],
  providers: [TransformerTemplateService, TransformerService],
  exports: [TransformerTemplateService],
})
export class TransformModule {}
