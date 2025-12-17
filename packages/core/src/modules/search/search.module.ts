import { Module } from '@nestjs/common';
import { AssetModule } from '../asset';
import { EventModule } from '../event';
import {
  SearchController,
  SearchIndexController,
  SearchProviderController,
} from './controllers';
import { SearchListeners } from './search.listeners';
import { SearchIndexService } from './services/search-index.service';
import { SearchProviderService } from './services/search-provider.service';

@Module({
  imports: [AssetModule, EventModule],
  controllers: [
    SearchController,
    SearchIndexController,
    SearchProviderController,
  ],
  providers: [SearchProviderService, SearchIndexService, SearchListeners],
})
export class SearchModule {}
