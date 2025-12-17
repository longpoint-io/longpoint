import { ClassifierTemplateService } from '../../../classifier/services/classifier-template.service';
import { RunClassifierAction } from '../../rule.types';
import {
  RuleActionExecutor,
  RuleExecutionContext,
} from '../rule-executor.service';

export class RunClassifierExecutor implements RuleActionExecutor {
  constructor(
    private readonly classifierTemplateService: ClassifierTemplateService
  ) {}

  async execute(
    action: RunClassifierAction,
    context: RuleExecutionContext
  ): Promise<void> {
    const { eventPayload } = context;
    const variantId = eventPayload.id;

    const template =
      await this.classifierTemplateService.getClassifierTemplateByIdOrThrow(
        action.classifierTemplateId
      );

    await template.run(variantId);
  }
}
