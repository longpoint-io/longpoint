import { Global, Module } from '@nestjs/common';
import { PluginController } from './controllers/plugin.controller';
import { PluginRegistryService, PluginService } from './services';

@Global()
@Module({
  controllers: [PluginController],
  providers: [PluginRegistryService, PluginService],
  exports: [PluginRegistryService, PluginService],
})
export class PluginModule {}

