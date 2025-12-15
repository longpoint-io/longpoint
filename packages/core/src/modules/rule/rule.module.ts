import { Module, forwardRef } from '@nestjs/common';
import { AssetModule } from '../asset';
import { ClassifierModule } from '../classifier';
import { EventModule } from '../event';
import { TransformModule } from '../transform';
import { RuleController } from './controllers/rule.controller';
import { RuleListeners } from './rule.listeners';
import { RuleService } from './services/rule.service';

@Module({
  imports: [
    EventModule,
    forwardRef(() => AssetModule),
    ClassifierModule,
    TransformModule,
  ],
  controllers: [RuleController],
  providers: [RuleService, RuleListeners],
})
export class RuleModule {}
