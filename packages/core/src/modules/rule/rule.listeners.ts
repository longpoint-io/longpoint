import { Injectable, Logger } from '@nestjs/common';
import {
  AssetEventKey,
  type AssetVariantReadyEventPayload,
} from '../asset/asset.events';
import { HandleEvent } from '../event';
import { RuleService } from './services/rule.service';

@Injectable()
export class RuleListeners {
  private readonly logger = new Logger(RuleListeners.name);

  constructor(private readonly ruleService: RuleService) {}

  @HandleEvent(AssetEventKey.ASSET_VARIANT_READY)
  async handleAssetVariantReady(payload: AssetVariantReadyEventPayload) {
    const rules = await this.ruleService.listRulesForEvent(
      'asset.variant.ready'
    );

    if (rules.length === 0) {
      return;
    }

    await Promise.allSettled(
      rules.map(async (rule) => {
        try {
          const shouldExecute = await rule.evaluate(payload);

          if (shouldExecute) {
            await rule.execute(payload);
          }
        } catch (error) {
          this.logger.error(
            `Error evaluating/executing rule ${rule.id} for variant ${payload.id}:`,
            error
          );
        }
      })
    );
  }
}
