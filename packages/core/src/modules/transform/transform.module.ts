import { Module } from '@nestjs/common';
import { TransformController as TransformTemplateController } from './controllers/transform-template.controller';
import { TransformerController } from './controllers/transformer.controller';
import { TransformTemplateService } from './services/transform-template.service';
import { TransformerService } from './services/transformer.service';

@Module({
  controllers: [TransformTemplateController, TransformerController],
  providers: [TransformTemplateService, TransformerService],
})
export class TransformModule {}
