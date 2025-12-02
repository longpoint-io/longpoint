import { Module } from '@nestjs/common';
import { EventModule } from '../event';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';

@Module({
  imports: [EventModule],
  controllers: [CollectionController],
  providers: [CollectionService],
})
export class CollectionModule {}
