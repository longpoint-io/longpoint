import { ApiSchema, PickType } from '@nestjs/swagger';
import { PluginDto, PluginParams } from './plugin.dto';

export type PluginSummaryParams = Pick<
  PluginParams,
  'id' | 'displayName' | 'description' | 'icon' | 'hasSettings'
>;

@ApiSchema({ name: 'PluginSummary' })
export class PluginSummaryDto extends PickType(PluginDto, [
  'id',
  'displayName',
  'description',
  'icon',
  'hasSettings',
]) {
  constructor(data: PluginSummaryParams) {
    super();
    this.id = data.id;
    this.displayName = data.displayName;
    this.description = data.description ?? null;
    this.icon = data.icon ?? null;
    this.hasSettings = data.hasSettings;
  }
}
