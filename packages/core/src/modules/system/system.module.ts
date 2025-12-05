import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [AssetModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
