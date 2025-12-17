import { TransformerTemplateService } from '../../../transform/services/transformer-template.service';
import { RunTransformerAction } from '../../rule.types';
import {
  RuleActionExecutor,
  RuleExecutionContext,
} from '../rule-executor.service';

export class RunTransformerExecutor implements RuleActionExecutor {
  constructor(
    private readonly transformerTemplateService: TransformerTemplateService
  ) {}

  async execute(
    action: RunTransformerAction,
    context: RuleExecutionContext
  ): Promise<void> {
    const { eventPayload } = context;
    let sourceVariantId = action.sourceVariantId;

    if (sourceVariantId.includes('{{')) {
      sourceVariantId = this.interpolateTemplate(sourceVariantId, eventPayload);
    }

    const template =
      await this.transformerTemplateService.getTransformerTemplateByIdOrThrow(
        action.transformerTemplateId
      );

    await template.transformAssetVariant(sourceVariantId);
  }

  private interpolateTemplate(
    template: string,
    payload: { id: string; assetId: string }
  ): string {
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
      if (key === 'variant.id') {
        return payload.id;
      }
      if (key === 'asset.id') {
        return payload.assetId;
      }
      return match;
    });
  }
}
