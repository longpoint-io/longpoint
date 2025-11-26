import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { paths, components } from './types';

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class Longpoint {
  private httpClient: AxiosInstance;
  system: SystemClient;
  analysis: AnalysisClient;
  media: MediaClient;
  storage: StorageClient;
  search: SearchClient;

  constructor(config: ClientConfig = {}) {
    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'http://localhost:3000/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` })
      }
    });
    this.system = new SystemClient(this.httpClient);
    this.analysis = new AnalysisClient(this.httpClient);
    this.media = new MediaClient(this.httpClient);
    this.storage = new StorageClient(this.httpClient);
    this.search = new SearchClient(this.httpClient);
  }
}

class SystemClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * List all installed plugins
   */
    async listPlugins(): Promise<components['schemas']['PluginSummary'][]> {
        const url = `plugins`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a plugin by ID
   */
    async getPlugin(pluginId: string): Promise<components['schemas']['Plugin']> {
        const url = `plugins/${encodeURIComponent(String(pluginId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update plugin settings
   */
    async updatePluginSettings(pluginId: string, data: components['schemas']['UpdatePluginSettings']): Promise<components['schemas']['Plugin']> {
        const url = `plugins/${encodeURIComponent(String(pluginId))}/settings`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Get system setup status
   */
    async getSetupStatus(): Promise<components['schemas']['SetupStatus']> {
        const url = `system/setup/status`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get system status
   */
    async getSystemStatus(): Promise<components['schemas']['SystemStatus']> {
        const url = `system/status`;
        const response = await this.httpClient.get(url);
        return response.data;
  }
}

class AnalysisClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Create a classifier
   */
    async createClassifier(data: components['schemas']['CreateClassifier']): Promise<components['schemas']['Classifier']> {
        const url = `analysis/classifiers`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List classifiers
   */
    async listClassifiers(): Promise<components['schemas']['ClassifierSummary'][]> {
        const url = `analysis/classifiers`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a classifier
   */
    async getClassifier(classifierId: string): Promise<components['schemas']['Classifier']> {
        const url = `analysis/classifiers/${encodeURIComponent(String(classifierId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a classifier
   */
    async updateClassifier(classifierId: string, data: components['schemas']['UpdateClassifier']): Promise<components['schemas']['Classifier']> {
        const url = `analysis/classifiers/${encodeURIComponent(String(classifierId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a classifier
   */
    async deleteClassifier(classifierId: string): Promise<void> {
        const url = `analysis/classifiers/${encodeURIComponent(String(classifierId))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * List classification providers
   */
    async listClassificationProviders(): Promise<components['schemas']['ClassificationProvider'][]> {
        const url = `analysis/classification-providers`;
        const response = await this.httpClient.get(url);
        return response.data;
  }
}

class MediaClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Create a media container
   *
   * Creates an empty container that is ready to receive an upload.
   */
    async createMedia(data: components['schemas']['CreateMediaContainer']): Promise<components['schemas']['CreateMediaContainerResponse']> {
        const url = `media/containers`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Get a media container
   */
    async getMedia(containerId: string): Promise<components['schemas']['MediaContainer']> {
        const url = `media/containers/${encodeURIComponent(String(containerId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a media container
   */
    async updateMedia(containerId: string, data: components['schemas']['UpdateMediaContainer']): Promise<components['schemas']['MediaContainer']> {
        const url = `media/containers/${encodeURIComponent(String(containerId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a media container
   *
   * All associated assets will be deleted.
   */
    async deleteMedia(containerId: string, data: components['schemas']['DeleteMediaContainer']): Promise<void> {
        const url = `media/containers/${encodeURIComponent(String(containerId))}`;
        const response = await this.httpClient.delete(url, { data });
        return response.data;
  }

    /**
   * List the contents of a media tree
   */
    async getTree(options?: { path?: string }): Promise<components['schemas']['MediaTree']> {
        const params = new URLSearchParams();
        if (options) {
          if (options.path !== undefined) {
            params.append('path', String(options.path));
          }
        }
        const queryString = params.toString();
        const url = `media/tree${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Generate links for media containers
   */
    async generateLinks(data: components['schemas']['GenerateMediaLinks']): Promise<Record<string, any>> {
        const url = `media/links`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Upload an asset to a media container
   */
    async upload(containerId: string, options?: { token?: string }): Promise<void> {
        const params = new URLSearchParams();
        if (options) {
          if (options.token !== undefined) {
            params.append('token', String(options.token));
          }
        }
        const queryString = params.toString();
        const url = `media/containers/${encodeURIComponent(String(containerId))}/upload${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.put(url);
        return response.data;
  }
}

class StorageClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Create a storage unit
   */
    async createStorageUnit(data: components['schemas']['CreateStorageUnit']): Promise<components['schemas']['StorageUnit']> {
        const url = `storage/units`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List storage units
   */
    async listStorageUnits(options?: { cursor?: string; pageSize?: number; configId?: string }): Promise<components['schemas']['ListStorageUnitsResponse']> {
        const params = new URLSearchParams();
        if (options) {
          if (options.cursor !== undefined) {
            params.append('cursor', String(options.cursor));
          }
          if (options.pageSize !== undefined) {
            params.append('pageSize', String(options.pageSize));
          }
          if (options.configId !== undefined) {
            params.append('configId', String(options.configId));
          }
        }
        const queryString = params.toString();
        const url = `storage/units${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a storage unit
   */
    async getStorageUnit(storageUnitId: string): Promise<components['schemas']['StorageUnit']> {
        const url = `storage/units/${encodeURIComponent(String(storageUnitId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a storage unit
   */
    async updateStorageUnit(storageUnitId: string, data: components['schemas']['UpdateStorageUnit']): Promise<components['schemas']['StorageUnit']> {
        const url = `storage/units/${encodeURIComponent(String(storageUnitId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a storage unit
   */
    async deleteStorageUnit(storageUnitId: string): Promise<void> {
        const url = `storage/units/${encodeURIComponent(String(storageUnitId))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * List installed storage providers
   */
    async listStorageProviders(): Promise<components['schemas']['StorageProvider'][]> {
        const url = `storage/providers`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Create a storage provider config
   */
    async createStorageConfig(data: components['schemas']['CreateStorageConfig']): Promise<components['schemas']['StorageConfig']> {
        const url = `storage/configs`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List storage configs
   */
    async listStorageConfigs(options?: { providerId?: string }): Promise<components['schemas']['StorageConfigSummary'][]> {
        const params = new URLSearchParams();
        if (options) {
          if (options.providerId !== undefined) {
            params.append('providerId', String(options.providerId));
          }
        }
        const queryString = params.toString();
        const url = `storage/configs${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a storage config
   */
    async getStorageConfig(id: string): Promise<components['schemas']['StorageConfig']> {
        const url = `storage/configs/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a storage config
   */
    async updateStorageConfig(id: string, data: components['schemas']['UpdateStorageConfig']): Promise<components['schemas']['StorageConfig']> {
        const url = `storage/configs/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a storage config
   */
    async deleteStorageConfig(id: string): Promise<void> {
        const url = `storage/configs/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }
}

class SearchClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Search media containers
   */
    async searchMedia(data: components['schemas']['SearchQuery']): Promise<components['schemas']['SearchResults']> {
        const url = `search`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Create a search index
   */
    async createSearchIndex(data: components['schemas']['CreateSearchIndex']): Promise<components['schemas']['SearchIndex']> {
        const url = `search/indexes`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List search indexes
   */
    async listSearchIndexes(): Promise<components['schemas']['SearchIndex'][]> {
        const url = `search/indexes`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Delete a search index
   */
    async deleteSearchIndex(id: string): Promise<void> {
        const url = `search/indexes/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * List installed vector providers
   */
    async listVectorProviders(): Promise<components['schemas']['VectorProvider'][]> {
        const url = `search/vector-providers`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update the config for a vector provider
   */
    async updateVectorProviderConfig(providerId: string, data: components['schemas']['UpdateVectorProviderConfig']): Promise<components['schemas']['VectorProvider']> {
        const url = `search/vector-providers/${encodeURIComponent(String(providerId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }
}

// Export default instance
export const longpoint = new Longpoint();
export default longpoint;
