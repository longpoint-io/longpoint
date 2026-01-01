import { DebounceTaskExecutor } from '@/shared/utils/debounce-task.executor';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  AssetEventKey,
  type AssetDeletedEventPayload,
  type AssetReadyEventPayload,
  type AssetVariantDeletedEventPayload,
  type AssetVariantUpdatedEventPayload,
} from '../asset';
import {
  ClassifierEventKey,
  type ClassifierRunCompleteEventPayload,
} from '../classifier';
import { HandleEvent } from '../event';
import { SearchIndexService } from './services/search-index.service';

@Injectable()
export class SearchListeners implements OnModuleDestroy {
  private readonly indexExecutor: DebounceTaskExecutor;

  constructor(private readonly searchIndexService: SearchIndexService) {
    this.indexExecutor = new DebounceTaskExecutor(
      async () => {
        const activeIndex = await this.searchIndexService.getActiveIndex();
        if (activeIndex) {
          await activeIndex.sync();
        }
      },
      {
        name: 'SearchIndexSync',
        debounceMs: 1000,
        maxDebounceMs: 5000,
        maxRetries: 3,
        retryDelayMs: 1000,
      }
    );
  }

  @HandleEvent(AssetEventKey.ASSET_READY)
  async handleAssetReady(payload: AssetReadyEventPayload) {
    await this.indexExecutor.requestRun();
  }

  @HandleEvent(AssetEventKey.ASSET_VARIANT_UPDATED)
  async handleAssetVariantUpdated(payload: AssetVariantUpdatedEventPayload) {
    await this.indexExecutor.requestRun();
  }

  @HandleEvent(AssetEventKey.ASSET_VARIANT_DELETED)
  async handleAssetVariantDeleted(payload: AssetVariantDeletedEventPayload) {
    await this.indexExecutor.requestRun();
  }

  @HandleEvent(AssetEventKey.ASSET_DELETED)
  async handleAssetDeleted(payload: AssetDeletedEventPayload) {
    await this.indexExecutor.requestRun();
  }

  @HandleEvent(ClassifierEventKey.CLASSIFIER_RUN_COMPLETE)
  async handleClassifierRunComplete(
    payload: ClassifierRunCompleteEventPayload
  ) {
    const activeIndex = await this.searchIndexService.getActiveIndex();
    if (activeIndex) {
      await activeIndex.markAssetsAsStale([payload.assetId]);
      await this.indexExecutor.requestRun();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.indexExecutor.close();
  }
}
