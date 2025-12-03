import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { EventModule } from '../event';
import {
  SearchController,
  SearchIndexController,
  VectorProviderController,
} from './controllers';
import { SearchListeners } from './search.listeners';
import { SearchIndexService } from './services/search-index.service';
import { VectorProviderService } from './services/vector-provider.service';

@Module({
  imports: [AssetModule, EventModule],
  controllers: [
    SearchController,
    SearchIndexController,
    VectorProviderController,
  ],
  providers: [VectorProviderService, SearchIndexService, SearchListeners],
})
export class SearchModule {}
