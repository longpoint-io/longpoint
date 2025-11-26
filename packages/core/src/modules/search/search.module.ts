import { Module } from '@nestjs/common';
import { EventModule } from '../event';
import { MediaModule } from '../media';
import {
  SearchController,
  SearchIndexController,
  VectorProviderController,
} from './controllers';
import { SearchListeners } from './search.listeners';
import { SearchIndexService } from './services/search-index.service';
import { VectorProviderService } from './services/vector-provider.service';

@Module({
  imports: [MediaModule, EventModule],
  controllers: [
    SearchController,
    SearchIndexController,
    VectorProviderController,
  ],
  providers: [VectorProviderService, SearchIndexService, SearchListeners],
})
export class SearchModule {}
