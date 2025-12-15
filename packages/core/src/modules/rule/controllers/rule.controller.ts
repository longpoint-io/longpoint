import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiSdkTag, RequirePermission } from '../../../shared/decorators';
import {
  CreateRuleDto,
  ListRulesQueryDto,
  ListRulesResponseDto,
  RuleDetailsDto,
  RuleDto,
  UpdateRuleDto,
} from '../dtos';
import { ApiRuleNotFoundResponse } from '../rule.errors';
import { RuleService } from '../services/rule.service';

@Controller('rules')
@ApiSdkTag(SdkTag.Rules)
@ApiBearerAuth()
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Post()
  @RequirePermission(Permission.RULES_CREATE)
  @ApiOperation({
    summary: 'Create a rule',
    operationId: 'createRule',
  })
  @ApiCreatedResponse({ type: RuleDto })
  async createRule(@Body() body: CreateRuleDto) {
    const rule = await this.ruleService.createRule(body);
    return rule.toDetailsDto();
  }

  @Get(':ruleId')
  @RequirePermission(Permission.RULES_READ)
  @ApiOperation({
    summary: 'Get a rule',
    operationId: 'getRule',
  })
  @ApiOkResponse({ type: RuleDetailsDto })
  @ApiRuleNotFoundResponse()
  async getRule(@Param('ruleId') ruleId: string) {
    const rule = await this.ruleService.getRuleByIdOrThrow(ruleId);
    return rule.toDetailsDto();
  }

  @Get()
  @RequirePermission(Permission.RULES_READ)
  @ApiOperation({
    summary: 'List rules',
    operationId: 'listRules',
  })
  @ApiOkResponse({
    type: ListRulesResponseDto,
  })
  async listRules(@Query() query: ListRulesQueryDto) {
    const rules = await this.ruleService.listRules(query);
    return new ListRulesResponseDto({
      items: rules.map((rule) => rule.toDto()),
      path: '/rules',
      query,
    });
  }

  @Patch(':ruleId')
  @RequirePermission(Permission.RULES_UPDATE)
  @ApiOperation({
    summary: 'Update a rule',
    operationId: 'updateRule',
  })
  @ApiOkResponse({ type: RuleDto })
  @ApiRuleNotFoundResponse()
  async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateRuleDto
  ) {
    const rule = await this.ruleService.getRuleByIdOrThrow(ruleId);
    await rule.update(body);
    return rule.toDto();
  }

  @Delete(':ruleId')
  @RequirePermission(Permission.RULES_DELETE)
  @ApiOperation({
    summary: 'Delete a rule',
    operationId: 'deleteRule',
  })
  @ApiOkResponse({ description: 'The rule was deleted' })
  @ApiRuleNotFoundResponse()
  async deleteRule(@Param('ruleId') ruleId: string) {
    const rule = await this.ruleService.getRuleByIdOrThrow(ruleId);
    await rule.delete();
  }
}
