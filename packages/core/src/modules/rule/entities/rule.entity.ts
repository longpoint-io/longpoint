import { Prisma } from '@/database';
import { AssetService } from '../../asset';
import type { AssetVariantReadyEventPayload } from '../../asset/asset.events';
import { ClassifierTemplateService } from '../../classifier/services/classifier-template.service';
import { PrismaService } from '../../common/services';
import { TransformTemplateService } from '../../transform/services/transform-template.service';
import {
  RuleDetailsDto,
  RuleDto,
  RunClassifierActionDto,
  RunTransformerActionDto,
  UpdateRuleDto,
} from '../dtos';
import { RuleNotFound } from '../rule.errors';
import { RuleAction, RuleCondition } from '../rule.types';
import { RuleEvaluatorService } from '../services/rule-evaluator.service';
import { RuleExecutorService } from '../services/rule-executor.service';

export interface RuleEntityArgs {
  id: string;
  displayName: string;
  enabled: boolean;
  triggerEvent: string;
  condition: RuleCondition | null;
  actions: RuleAction[];
  createdAt: Date;
  updatedAt: Date;
  prismaService: PrismaService;
  assetService: AssetService;
  classifierTemplateService: ClassifierTemplateService;
  transformTemplateService: TransformTemplateService;
}

export class RuleEntity {
  readonly id: string;

  private _displayName: string;
  private _enabled: boolean;
  private _triggerEvent: string;
  private _condition: RuleCondition | null;
  private _actions: RuleAction[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private readonly prismaService: PrismaService;
  private readonly evaluatorService: RuleEvaluatorService;
  private readonly executorService: RuleExecutorService;

  constructor(args: RuleEntityArgs) {
    this.id = args.id;
    this._displayName = args.displayName;
    this._enabled = args.enabled;
    this._triggerEvent = args.triggerEvent;
    this._condition = args.condition;
    this._actions = args.actions;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.prismaService = args.prismaService;
    this.evaluatorService = new RuleEvaluatorService(args.assetService);
    this.executorService = new RuleExecutorService(
      args.classifierTemplateService,
      args.transformTemplateService
    );
  }

  async evaluate(
    eventPayload: AssetVariantReadyEventPayload
  ): Promise<boolean> {
    return this.evaluatorService.evaluate(this._condition, eventPayload);
  }

  async execute(eventPayload: AssetVariantReadyEventPayload): Promise<void> {
    return this.executorService.execute(this._actions, eventPayload);
  }

  async update(data: UpdateRuleDto) {
    try {
      const updated = await this.prismaService.rule.update({
        where: { id: this.id },
        data: {
          displayName: data.displayName,
          enabled: data.enabled,
          triggerEvent: data.triggerEvent,
          condition: data.condition as unknown as Prisma.InputJsonObject,
          actions: data.actions as unknown as Prisma.InputJsonValue[],
        },
      });

      this._displayName = updated.displayName;
      this._enabled = updated.enabled;
      this._triggerEvent = updated.triggerEvent;
      this._condition = updated.condition as RuleCondition | null;
      this._actions = updated.actions as unknown as RuleAction[];
      this._updatedAt = updated.updatedAt;
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new RuleNotFound(this.id);
      }
      throw e;
    }
  }

  async delete() {
    try {
      await this.prismaService.rule.delete({
        where: { id: this.id },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new RuleNotFound(this.id);
      }
      throw e;
    }
  }

  toDto(): RuleDto {
    return new RuleDto({
      id: this.id,
      displayName: this.displayName,
      enabled: this.enabled,
      triggerEvent: this.triggerEvent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  toDetailsDto(): RuleDetailsDto {
    const actions = this.actions.map((action) =>
      action.type === 'runClassifier'
        ? new RunClassifierActionDto(action)
        : new RunTransformerActionDto(action)
    );
    return new RuleDetailsDto({
      id: this.id,
      displayName: this.displayName,
      enabled: this.enabled,
      triggerEvent: this.triggerEvent,
      condition: this.condition,
      actions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  get displayName(): string {
    return this._displayName;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get triggerEvent(): string {
    return this._triggerEvent;
  }

  get condition(): RuleCondition | null {
    return this._condition;
  }

  get actions(): RuleAction[] {
    return this._actions;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
