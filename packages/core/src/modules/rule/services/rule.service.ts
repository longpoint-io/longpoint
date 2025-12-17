import { Prisma } from '@/database';
import { EventKey } from '@/modules/event';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AssetService } from '../../asset';
import { ClassifierTemplateService } from '../../classifier/services/classifier-template.service';
import { PrismaService } from '../../common/services';
import { TransformerTemplateService } from '../../transform/services/transformer-template.service';
import { CreateRuleDto } from '../dtos/create-rule.dto';
import { ListRulesQueryDto } from '../dtos/list-rules-query.dto';
import { RuleEntity } from '../entities/rule.entity';
import { RuleNotFound } from '../rule.errors';
import { SelectedRule, selectRule } from '../rule.selectors';
import { RuleAction, RuleCondition } from '../rule.types';

@Injectable()
export class RuleService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(forwardRef(() => AssetService))
    private readonly assetService: AssetService,
    private readonly classifierTemplateService: ClassifierTemplateService,
    private readonly transformerTemplateService: TransformerTemplateService
  ) {}

  async createRule(data: CreateRuleDto): Promise<RuleEntity> {
    const rule = await this.prismaService.rule.create({
      data: {
        displayName: data.displayName,
        enabled: data.enabled ?? true,
        triggerEvent: data.triggerEvent,
        condition: data.condition as unknown as Prisma.InputJsonObject,
        actions: {
          set: data.actions as unknown as Prisma.InputJsonValue[],
        },
      },
      select: selectRule(),
    });

    return this.getRuleEntity(rule);
  }

  async getRuleById(id: string): Promise<RuleEntity | null> {
    const rule = await this.prismaService.rule.findUnique({
      where: { id },
      select: selectRule(),
    });

    if (!rule) {
      return null;
    }

    return this.getRuleEntity(rule);
  }

  async getRuleByIdOrThrow(id: string): Promise<RuleEntity> {
    const rule = await this.getRuleById(id);
    if (!rule) {
      throw new RuleNotFound(id);
    }
    return rule;
  }

  async listRules(
    query: ListRulesQueryDto = new ListRulesQueryDto()
  ): Promise<RuleEntity[]> {
    const rules = await this.prismaService.rule.findMany({
      ...query.toPrisma(),
      select: selectRule(),
    });

    return rules.map((rule) => this.getRuleEntity(rule));
  }

  async listRulesForEvent(triggerEvent: EventKey): Promise<RuleEntity[]> {
    const rules = await this.prismaService.rule.findMany({
      where: {
        triggerEvent,
        enabled: true,
      },
      select: selectRule(),
    });

    return rules.map((rule) => this.getRuleEntity(rule));
  }

  private getRuleEntity(data: SelectedRule): RuleEntity {
    return new RuleEntity({
      id: data.id,
      displayName: data.displayName,
      enabled: data.enabled,
      triggerEvent: data.triggerEvent,
      condition: data.condition as RuleCondition | null,
      actions: data.actions as unknown as RuleAction[],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      prismaService: this.prismaService,
      assetService: this.assetService,
      classifierTemplateService: this.classifierTemplateService,
      transformerTemplateService: this.transformerTemplateService,
    });
  }
}
