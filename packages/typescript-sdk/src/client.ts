import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { paths, components } from './types';
import { LongpointError } from './error';

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class Longpoint {
  private httpClient: AxiosInstance;
  plugins: PluginsClient;
  analysis: AnalysisClient;
  assets: AssetsClient;
  storage: StorageClient;
  collections: CollectionsClient;
  users: UsersClient;
  search: SearchClient;
  system: SystemClient;

  constructor(config: ClientConfig = {}) {
    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'http://localhost:3000/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` })
      }
    });

    // Add response interceptor to convert AxiosError to LongpointError
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response && error.response.status >= 400) {
          throw LongpointError.fromAxiosError(error);
        }
        throw error;
      }
    );

    this.plugins = new PluginsClient(this.httpClient);
    this.analysis = new AnalysisClient(this.httpClient);
    this.assets = new AssetsClient(this.httpClient);
    this.storage = new StorageClient(this.httpClient);
    this.collections = new CollectionsClient(this.httpClient);
    this.users = new UsersClient(this.httpClient);
    this.search = new SearchClient(this.httpClient);
    this.system = new SystemClient(this.httpClient);
  }
}

class PluginsClient {
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

class AssetsClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * List assets
   */
    async listAssets(options?: { cursor?: string; pageSize?: number; collectionIds?: string[] }): Promise<components['schemas']['ListAssetsResponse']> {
        const params = new URLSearchParams();
        if (options) {
          if (options.cursor !== undefined) {
            params.append('cursor', String(options.cursor));
          }
          if (options.pageSize !== undefined) {
            params.append('pageSize', String(options.pageSize));
          }
          if (options.collectionIds !== undefined) {
            if (Array.isArray(options.collectionIds)) {
              options.collectionIds.forEach((item) => {
                params.append('collectionIds', String(item));
              });
            } else {
              params.append('collectionIds', String(options.collectionIds));
            }
          }
        }
        const queryString = params.toString();
        const url = `assets${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Create an asset
   *
   * Creates an empty asset that is ready to receive an upload.
   */
    async createAsset(data: components['schemas']['CreateAsset']): Promise<components['schemas']['CreateAssetResponse']> {
        const url = `assets`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Get an asset
   */
    async getAsset(assetId: string): Promise<components['schemas']['Asset']> {
        const url = `assets/${encodeURIComponent(String(assetId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update an asset
   */
    async updateAsset(assetId: string, data: components['schemas']['UpdateAsset']): Promise<components['schemas']['Asset']> {
        const url = `assets/${encodeURIComponent(String(assetId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete an asset
   *
   * All associated variants will be deleted.
   */
    async deleteAsset(assetId: string, data: components['schemas']['DeleteAsset']): Promise<void> {
        const url = `assets/${encodeURIComponent(String(assetId))}`;
        const response = await this.httpClient.delete(url, { data });
        return response.data;
  }

    /**
   * Generate links for assets
   */
    async generateLinks(data: components['schemas']['GenerateMediaLinks']): Promise<Record<string, any>> {
        const url = `asset-links`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Upload an asset variant
   */
    async upload(assetId: string, options?: { token?: string }): Promise<void> {
        const params = new URLSearchParams();
        if (options) {
          if (options.token !== undefined) {
            params.append('token', String(options.token));
          }
        }
        const queryString = params.toString();
        const url = `assets/${encodeURIComponent(String(assetId))}/upload${queryString ? `?${queryString}` : ''}`;
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

class CollectionsClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Create a collection
   *
   * Creates a new collection for organizing media containers.
   */
    async createCollection(data: components['schemas']['CreateCollection']): Promise<components['schemas']['Collection']> {
        const url = `collections`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List collections
   */
    async listCollections(options?: { cursor?: string; pageSize?: number; sort?: 'updatedAt:desc' | 'name:asc' | 'name:desc' }): Promise<components['schemas']['ListCollectionsResponse']> {
        const params = new URLSearchParams();
        if (options) {
          if (options.cursor !== undefined) {
            params.append('cursor', String(options.cursor));
          }
          if (options.pageSize !== undefined) {
            params.append('pageSize', String(options.pageSize));
          }
          if (options.sort !== undefined) {
            params.append('sort', String(options.sort));
          }
        }
        const queryString = params.toString();
        const url = `collections${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a collection
   */
    async getCollection(id: string): Promise<components['schemas']['CollectionDetails']> {
        const url = `collections/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a collection
   */
    async updateCollection(id: string, data: components['schemas']['UpdateCollection']): Promise<components['schemas']['CollectionDetails']> {
        const url = `collections/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a collection
   *
   * Soft deletes a collection by default. Pass permanently=true in body to permanently delete.
   */
    async deleteCollection(id: string): Promise<void> {
        const url = `collections/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * Add assets to a collection
   */
    async addAssetsToCollection(id: string, data: components['schemas']['AddAssetsToCollection']): Promise<void> {
        const url = `collections/${encodeURIComponent(String(id))}/assets`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * Remove assets from a collection
   */
    async removeAssetsFromCollection(id: string, data: components['schemas']['RemoveAssetsFromCollection']): Promise<void> {
        const url = `collections/${encodeURIComponent(String(id))}/assets`;
        const response = await this.httpClient.delete(url, { data });
        return response.data;
  }
}

class UsersClient {
  constructor(private httpClient: AxiosInstance) {}

    /**
   * Create a user role
   */
    async createRole(data: components['schemas']['CreateRole']): Promise<components['schemas']['RoleDetails']> {
        const url = `roles`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List available user roles
   */
    async listRoles(): Promise<components['schemas']['Role'][]> {
        const url = `roles`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a user role
   */
    async getRole(id: string): Promise<components['schemas']['RoleDetails']> {
        const url = `roles/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a user role
   */
    async updateRole(id: string, data: components['schemas']['UpdateRole']): Promise<components['schemas']['RoleDetails']> {
        const url = `roles/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a user role
   */
    async deleteRole(id: string): Promise<void> {
        const url = `roles/${encodeURIComponent(String(id))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * List users
   */
    async listUsers(options?: { cursor?: string; pageSize?: number }): Promise<components['schemas']['ListUsersResponse']> {
        const params = new URLSearchParams();
        if (options) {
          if (options.cursor !== undefined) {
            params.append('cursor', String(options.cursor));
          }
          if (options.pageSize !== undefined) {
            params.append('pageSize', String(options.pageSize));
          }
        }
        const queryString = params.toString();
        const url = `users${queryString ? `?${queryString}` : ''}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Get a user
   */
    async getUser(userId: string): Promise<components['schemas']['User']> {
        const url = `users/${encodeURIComponent(String(userId))}`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Update a user
   */
    async updateUser(userId: string, data: components['schemas']['UpdateUser']): Promise<components['schemas']['User']> {
        const url = `users/${encodeURIComponent(String(userId))}`;
        const response = await this.httpClient.patch(url, data);
        return response.data;
  }

    /**
   * Delete a user
   */
    async deleteUser(userId: string): Promise<void> {
        const url = `users/${encodeURIComponent(String(userId))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * Create a user registration
   *
   * Creates a registration token that an external user can use to complete their signup.
   */
    async createUserRegistration(data: components['schemas']['CreateUserRegistration']): Promise<components['schemas']['CreateUserRegistrationResponse']> {
        const url = `user-registrations`;
        const response = await this.httpClient.post(url, data);
        return response.data;
  }

    /**
   * List user registrations
   */
    async listUserRegistrations(): Promise<components['schemas']['UserRegistration'][]> {
        const url = `user-registrations`;
        const response = await this.httpClient.get(url);
        return response.data;
  }

    /**
   * Revoke a user registration
   *
   * Invalidates the registration token, preventing a user from signing up with it.
   */
    async revokeUserRegistration(userRegistrationId: string): Promise<void> {
        const url = `user-registrations/${encodeURIComponent(String(userRegistrationId))}`;
        const response = await this.httpClient.delete(url);
        return response.data;
  }

    /**
   * Get a user registration
   */
    async getUserRegistration(token: string): Promise<components['schemas']['UserRegistration']> {
        const url = `user-registrations/${encodeURIComponent(String(token))}`;
        const response = await this.httpClient.get(url);
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

class SystemClient {
  constructor(private httpClient: AxiosInstance) {}

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

// Export default instance
export const longpoint = new Longpoint();
export default longpoint;
