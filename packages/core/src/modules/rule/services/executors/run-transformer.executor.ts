import { TransformTemplateService } from '../../../transform/services/transform-template.service';
import { RunTransformerAction } from '../../rule.types';
import {
  RuleActionExecutor,
  RuleExecutionContext,
} from '../rule-executor.service';

export class RunTransformerExecutor implements RuleActionExecutor {
  constructor(
    private readonly transformTemplateService: TransformTemplateService
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

    let template;
    if (action.transformTemplateId) {
      template =
        await this.transformTemplateService.getTransformTemplateByIdOrThrow(
          action.transformTemplateId
        );
    } else if (action.transformTemplateName) {
      const templates =
        await this.transformTemplateService.listTransformTemplates();
      template = templates.find((t) => t.name === action.transformTemplateName);
      if (!template) {
        throw new Error(
          `Transform template not found: ${action.transformTemplateName}`
        );
      }
    } else {
      throw new Error(
        'Either transformTemplateId or transformTemplateName must be provided'
      );
    }

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
