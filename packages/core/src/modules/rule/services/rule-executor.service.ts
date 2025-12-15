import { Logger } from '@nestjs/common';
import type { AssetVariantReadyEventPayload } from '../../asset/asset.events';
import { ClassifierTemplateService } from '../../classifier/services/classifier-template.service';
import { TransformTemplateService } from '../../transform/services/transform-template.service';
import { RuleAction } from '../rule.types';
import { RunClassifierExecutor } from './executors/run-classifier.executor';
import { RunTransformerExecutor } from './executors/run-transformer.executor';

export interface RuleActionExecutor {
  execute(action: RuleAction, context: RuleExecutionContext): Promise<void>;
}

export interface RuleExecutionContext {
  eventPayload: AssetVariantReadyEventPayload;
}

export class RuleExecutorService {
  private readonly logger = new Logger(RuleExecutorService.name);

  constructor(
    private readonly classifierTemplateService: ClassifierTemplateService,
    private readonly transformTemplateService: TransformTemplateService
  ) {}

  async execute(
    action: RuleAction,
    eventPayload: AssetVariantReadyEventPayload
  ): Promise<void> {
    const context: RuleExecutionContext = {
      eventPayload,
    };

    const executor = this.createExecutor(action.type);

    executor.execute(action, context).catch((error) => {
      this.logger.error(
        `Error executing rule action ${action.type} for variant ${eventPayload.id}:`,
        error
      );
    });
  }

  private createExecutor(actionType: RuleAction['type']): RuleActionExecutor {
    switch (actionType) {
      case 'runClassifier':
        return new RunClassifierExecutor(this.classifierTemplateService);
      case 'runTransformer':
        return new RunTransformerExecutor(this.transformTemplateService);
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
  }
}
