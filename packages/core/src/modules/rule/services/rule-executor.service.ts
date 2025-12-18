import { Logger } from '@nestjs/common';
import type { AssetVariantReadyEventPayload } from '../../asset/asset.events';
import { ClassifierTemplateService } from '../../classifier/services/classifier-template.service';
import { TransformerTemplateService } from '../../transform/services/transformer-template.service';
import { RuleAction, RuleActionType } from '../rule.types';
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
    private readonly transformerTemplateService: TransformerTemplateService
  ) {}

  async execute(
    actions: RuleAction[],
    eventPayload: AssetVariantReadyEventPayload
  ): Promise<void> {
    const context: RuleExecutionContext = {
      eventPayload,
    };

    const results = await Promise.allSettled(
      actions.map((action) => {
        const executor = this.createExecutor(action.type);
        return executor.execute(action, context);
      })
    );

    results.forEach((result, index) => {
      const action = actions[index];
      if (result.status === 'fulfilled') {
        this.logger.debug(
          `Successfully executed rule action ${action.type} for variant ${eventPayload.id}`
        );
      } else {
        this.logger.error(
          `Error executing rule action ${action.type} for variant ${eventPayload.id}:`,
          result.reason?.message || 'Unknown error'
        );
      }
    });
  }

  private createExecutor(actionType: RuleActionType): RuleActionExecutor {
    switch (actionType) {
      case RuleActionType.RUN_CLASSIFIER:
        return new RunClassifierExecutor(this.classifierTemplateService);
      case RuleActionType.RUN_TRANSFORMER:
        return new RunTransformerExecutor(this.transformerTemplateService);
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
  }
}
