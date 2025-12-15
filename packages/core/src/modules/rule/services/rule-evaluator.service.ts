import { AssetService } from '../../asset';
import type { AssetVariantReadyEventPayload } from '../../asset/asset.events';
import {
  ComparisonOperator,
  CompoundCondition,
  LogicalOperator,
  RuleCondition,
  SingleCondition,
} from '../rule.types';

interface EvaluationContext {
  variant: {
    id: string;
    type: string;
    status: string;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    size?: number | null;
    duration?: number | null;
    metadata?: Record<string, unknown> | null;
    [key: string]: unknown;
  };
  asset: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class RuleEvaluatorService {
  constructor(private readonly assetService: AssetService) {}

  async evaluate(
    condition: RuleCondition | null,
    eventPayload: AssetVariantReadyEventPayload
  ): Promise<boolean> {
    if (!condition) {
      return true;
    }

    const context = await this.buildContext(eventPayload);
    return this.evaluateCondition(condition, context);
  }

  private async buildContext(
    payload: AssetVariantReadyEventPayload
  ): Promise<EvaluationContext> {
    const variant = await this.assetService.getAssetVariantByIdOrThrow(
      payload.id
    );
    const asset = await this.assetService.getAssetByIdOrThrow(payload.assetId);

    return {
      variant: {
        id: variant.id,
        type: variant.type,
        status: variant.status,
        mimeType: variant.mimeType,
        width: variant.width,
        height: variant.height,
        size: variant.size,
        duration: variant.duration,
        metadata: variant.metadata as Record<string, unknown> | null,
      },
      asset: {
        id: asset.id,
      },
    };
  }

  private evaluateCondition(
    condition: RuleCondition,
    context: EvaluationContext
  ): boolean {
    if (this.isCompoundCondition(condition)) {
      return this.evaluateCompoundCondition(condition, context);
    } else {
      return this.evaluateSingleCondition(condition, context);
    }
  }

  private isCompoundCondition(
    condition: RuleCondition
  ): condition is CompoundCondition {
    return 'conditions' in condition && Array.isArray(condition.conditions);
  }

  private evaluateCompoundCondition(
    condition: CompoundCondition,
    context: EvaluationContext
  ): boolean {
    const results = condition.conditions.map((c) =>
      this.evaluateCondition(c, context)
    );

    if (condition.operator === LogicalOperator.AND) {
      return results.every((r) => r === true);
    } else {
      return results.some((r) => r === true);
    }
  }

  private evaluateSingleCondition(
    condition: SingleCondition,
    context: EvaluationContext
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case ComparisonOperator.EQUALS:
        return this.compareValues(fieldValue, conditionValue, '===');
      case ComparisonOperator.NOT_EQUALS:
        return this.compareValues(fieldValue, conditionValue, '!==');
      case ComparisonOperator.CONTAINS:
        return this.containsValue(fieldValue, conditionValue);
      case ComparisonOperator.IN:
        return this.isInValue(fieldValue, conditionValue);
      case ComparisonOperator.NOT_IN:
        return !this.isInValue(fieldValue, conditionValue);
      case ComparisonOperator.GREATER_THAN:
        return this.compareNumeric(fieldValue, conditionValue, '>');
      case ComparisonOperator.LESS_THAN:
        return this.compareNumeric(fieldValue, conditionValue, '<');
      default:
        return false;
    }
  }

  private getFieldValue(
    fieldPath: string,
    context: EvaluationContext
  ): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }

    return value;
  }

  private compareValues(
    left: unknown,
    right: unknown,
    operator: '===' | '!=='
  ): boolean {
    if (operator === '===') {
      return left === right;
    } else {
      return left !== right;
    }
  }

  private containsValue(fieldValue: unknown, conditionValue: unknown): boolean {
    if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
      return fieldValue.includes(conditionValue);
    }
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(conditionValue);
    }
    return false;
  }

  private isInValue(fieldValue: unknown, conditionValue: unknown): boolean {
    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(fieldValue);
    }
    return false;
  }

  private compareNumeric(
    left: unknown,
    right: unknown,
    operator: '>' | '<'
  ): boolean {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum === null || rightNum === null) {
      return false;
    }

    if (operator === '>') {
      return leftNum > rightNum;
    } else {
      return leftNum < rightNum;
    }
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}
