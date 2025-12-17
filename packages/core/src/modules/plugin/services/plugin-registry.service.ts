import {
  ClassifierContribution,
  LongpointPluginConfig,
  SearchContribution,
  StorageContribution,
  TransformerContribution,
} from '@longpoint/devkit';
import { findNodeModulesPath } from '@longpoint/utils/path';
import { toBase64DataUri } from '@longpoint/utils/string';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { createRequire } from 'module';
import { extname, join } from 'path';

interface BaseContributionRegistryEntry {
  packageName: string;
  packagePath: string;
  pluginId: string;
  fullyQualifiedId: string;
  pluginConfig: LongpointPluginConfig<any>;
}
export interface ClassifierRegistryEntry extends BaseContributionRegistryEntry {
  classifierKey: string;
  contribution: ClassifierContribution<any>;
}

export interface SearchProviderRegistryEntry
  extends BaseContributionRegistryEntry {
  searchId: string;
  contribution: SearchContribution<any>;
}

export interface StorageProviderRegistryEntry
  extends BaseContributionRegistryEntry {
  storageId: string;
  contribution: StorageContribution<any>;
}

export interface TransformerRegistryEntry
  extends BaseContributionRegistryEntry {
  transformerKey: string;
  contribution: TransformerContribution;
}

export interface PluginRegistryEntry {
  pluginId: string;
  packageName: string;
  packagePath: string;
  pluginConfig: LongpointPluginConfig<any>;
}

@Injectable()
export class PluginRegistryService implements OnModuleInit {
  private readonly logger = new Logger(PluginRegistryService.name);
  private readonly classifierRegistry = new Map<
    string,
    ClassifierRegistryEntry
  >();
  private readonly searchProviderRegistry = new Map<
    string,
    SearchProviderRegistryEntry
  >();
  private readonly storageProviderRegistry = new Map<
    string,
    StorageProviderRegistryEntry
  >();
  private readonly transformerRegistry = new Map<
    string,
    TransformerRegistryEntry
  >();

  async onModuleInit() {
    await this.discoverAllPlugins();
  }

  /**
   * Get all classifiers.
   * @returns Array of classifier registry entries
   */
  listClassifiers(): ClassifierRegistryEntry[] {
    return Array.from(this.classifierRegistry.values());
  }

  /**
   * Get a classifier by its fully qualified ID (e.g., 'openai/gpt-5-nano-2025-08-07').
   * @param id - The fully qualified classifier ID
   * @returns The classifier registry entry or null if not found
   */
  getClassifierById(id: string): ClassifierRegistryEntry | null {
    return this.classifierRegistry.get(id) || null;
  }

  /**
   * Get all search providers.
   * @returns Array of search provider registry entries
   */
  listSearchProviders(): SearchProviderRegistryEntry[] {
    return Array.from(this.searchProviderRegistry.values());
  }

  /**
   * Get a search provider by its fully qualified ID (e.g., 'pinecone/pinecone').
   * @param id - The fully qualified search provider ID
   * @returns The search provider registry entry or null if not found
   */
  getSearchProviderById(id: string): SearchProviderRegistryEntry | null {
    return this.searchProviderRegistry.get(id) || null;
  }

  /**
   * Get all storage providers.
   * @returns Array of storage provider registry entries
   */
  listStorageProviders(): StorageProviderRegistryEntry[] {
    return Array.from(this.storageProviderRegistry.values());
  }

  /**
   * Get a storage provider by its fully qualified ID (e.g., 's3/s3').
   * @param id - The fully qualified storage provider ID
   * @returns The storage provider registry entry or null if not found
   */
  getStorageProviderById(id: string): StorageProviderRegistryEntry | null {
    return this.storageProviderRegistry.get(id) || null;
  }

  /**
   * Get all transformers.
   * @returns Array of transformer registry entries
   */
  listTransformers(): TransformerRegistryEntry[] {
    return Array.from(this.transformerRegistry.values());
  }

  /**
   * Get a transformer by its fully qualified ID (e.g., 'transformers/transformers').
   * @param id - The fully qualified transformer ID
   * @returns The transformer registry entry or null if not found
   */
  getTransformerById(id: string): TransformerRegistryEntry | null {
    return this.transformerRegistry.get(id) || null;
  }

  /**
   * Get a plugin by its plugin ID (e.g., 'openai', 's3').
   * Aggregates from all provider registries and returns the first matching plugin.
   * @param pluginId - The plugin ID
   * @returns The plugin registry entry or null if not found
   */
  getPluginById(pluginId: string): PluginRegistryEntry | null {
    // Check classifiers
    for (const entry of this.classifierRegistry.values()) {
      if (entry.pluginId === pluginId) {
        return {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        };
      }
    }

    // Check search providers
    for (const entry of this.searchProviderRegistry.values()) {
      if (entry.pluginId === pluginId) {
        return {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        };
      }
    }

    // Check storage providers
    for (const entry of this.storageProviderRegistry.values()) {
      if (entry.pluginId === pluginId) {
        return {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        };
      }
    }

    // Check transformers
    for (const entry of this.transformerRegistry.values()) {
      if (entry.pluginId === pluginId) {
        return {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        };
      }
    }

    return null;
  }

  /**
   * List all installed plugins, deduplicated by pluginId.
   * Aggregates from all provider registries.
   * @returns Array of plugin registry entries
   */
  listPlugins(): PluginRegistryEntry[] {
    const pluginMap = new Map<string, PluginRegistryEntry>();

    // Add classifier plugins
    for (const entry of this.classifierRegistry.values()) {
      if (!pluginMap.has(entry.pluginId)) {
        pluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        });
      }
    }

    // Add search provider plugins
    for (const entry of this.searchProviderRegistry.values()) {
      if (!pluginMap.has(entry.pluginId)) {
        pluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        });
      }
    }

    // Add storage provider plugins
    for (const entry of this.storageProviderRegistry.values()) {
      if (!pluginMap.has(entry.pluginId)) {
        pluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        });
      }
    }

    // Add transformer plugins
    for (const entry of this.transformerRegistry.values()) {
      if (!pluginMap.has(entry.pluginId)) {
        pluginMap.set(entry.pluginId, {
          pluginId: entry.pluginId,
          packageName: entry.packageName,
          packagePath: entry.packagePath,
          pluginConfig: entry.pluginConfig,
        });
      }
    }

    return Array.from(pluginMap.values());
  }

  /**
   * Derive plugin ID from package name.
   * Converts 'longpoint-plugin-{name}' to '{name}'
   * @param packageName - The package name (e.g., 'longpoint-plugin-s3')
   * @returns The derived ID (e.g., 's3')
   */
  private derivePluginId(packageName: string): string {
    if (!packageName.startsWith('longpoint-plugin-')) {
      return packageName;
    }
    return packageName.replace(/^longpoint-plugin-/, '');
  }

  /**
   * Discover all installed plugins in node_modules.
   */
  private async discoverAllPlugins() {
    this.logger.debug(`Loading plugins...`);

    const modulesPath = findNodeModulesPath(process.cwd());
    if (!modulesPath) {
      this.logger.warn('Could not find node_modules directory');
      return;
    }

    const modules = await readdir(modulesPath);
    const packageNames = modules.filter((module) =>
      module.startsWith('longpoint-')
    );

    for (const packageName of packageNames) {
      try {
        await this.loadPlugin(packageName, modulesPath);
      } catch (error) {
        this.logger.error(
          `Failed to load plugin ${packageName}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    this.logger.log('Contributions:');
    this.logger.log(`  ${this.classifierRegistry.size} classifiers`);
    this.logger.log(`  ${this.searchProviderRegistry.size} search providers`);
    this.logger.log(`  ${this.storageProviderRegistry.size} storage providers`);
    this.logger.log(`  ${this.transformerRegistry.size} transformers`);
    this.logger.log('Plugins:');
    for (const plugin of this.listPlugins()) {
      this.logger.log(`  ${plugin.pluginId}`);
    }
    this.logger.log('');
  }

  /**
   * Load a single plugin from a package.
   * @param packageName - The package name
   * @param modulesPath - The path to node_modules
   */
  private async loadPlugin(packageName: string, modulesPath: string) {
    const packagePath = join(modulesPath, packageName);
    const require = createRequire(__filename);
    const pluginExport = require(join(packagePath, 'dist', 'index.js')).default;

    if (this.isLongpointPluginConfig(pluginExport)) {
      await this.loadLongpointPlugin(packageName, packagePath, pluginExport);
      return;
    }

    this.logger.error(
      `Plugin ${packageName} does not export a valid LongpointPluginConfig`
    );
  }

  /**
   * Check if a plugin export is a LongpointPluginConfig.
   */
  private isLongpointPluginConfig(
    pluginExport: any
  ): pluginExport is LongpointPluginConfig<any> {
    return (
      pluginExport &&
      typeof pluginExport === 'object' &&
      'contributes' in pluginExport &&
      !('type' in pluginExport)
    );
  }

  /**
   * Load a LongpointPluginConfig plugin and extract classification providers, search providers, and storage providers.
   */
  private async loadLongpointPlugin(
    packageName: string,
    packagePath: string,
    pluginConfig: LongpointPluginConfig<any>
  ) {
    const pluginId = this.derivePluginId(packageName);

    let processedIcon: string | undefined;
    if (pluginConfig.icon) {
      processedIcon = await this.processImage(pluginConfig.icon, packagePath);
    }

    const processedPluginConfig = {
      ...pluginConfig,
      icon: processedIcon,
    };

    // Extract classifiers
    if (pluginConfig.contributes?.classifiers) {
      for (const [classifierId, contribution] of Object.entries(
        pluginConfig.contributes.classifiers
      )) {
        const fullyQualifiedId = `${pluginId}/${classifierId}`;

        this.classifierRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          classifierKey: classifierId,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });

        this.logger.debug(
          `Loaded classifier: ${fullyQualifiedId} (${packageName})`
        );
      }
    }

    // Extract search providers
    if (pluginConfig.contributes?.search) {
      for (const [searchId, contribution] of Object.entries(
        pluginConfig.contributes.search
      )) {
        const fullyQualifiedId = `${pluginId}/${searchId}`;

        this.searchProviderRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          searchId,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });

        this.logger.debug(
          `Loaded search provider: ${fullyQualifiedId} (${packageName})`
        );
      }
    }

    // Extract storage providers
    if (pluginConfig.contributes?.storage) {
      for (const [storageId, contribution] of Object.entries(
        pluginConfig.contributes.storage
      )) {
        const fullyQualifiedId = `${pluginId}/${storageId}`;

        this.storageProviderRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          storageId,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });

        this.logger.debug(
          `Loaded storage provider: ${fullyQualifiedId} (${packageName})`
        );
      }
    }

    // Extract transformers
    if (pluginConfig.contributes?.transformers) {
      for (const [transformerKey, contribution] of Object.entries(
        pluginConfig.contributes.transformers
      )) {
        const fullyQualifiedId = `${pluginId}/${transformerKey}`;
        this.transformerRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          transformerKey,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });
        this.logger.debug(
          `Loaded transformer: ${fullyQualifiedId} (${packageName})`
        );
      }
    }
  }

  /**
   * Process an image value from the manifest.
   * If it's a URL (starts with http:// or https://), return it as is.
   * If it's a local file path, read it and convert to a base64 data URI.
   * @param imageValue - The image value from the manifest (URL or local file path)
   * @param packagePath - The path to the plugin package
   * @returns The processed image value (URL or base64 data URI)
   */
  private async processImage(
    imageValue: string,
    packagePath: string
  ): Promise<string | undefined> {
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
      return imageValue;
    }

    // Check common locations: assets/, dist/assets/, or root
    const possiblePaths = [
      join(packagePath, 'assets', imageValue),
      join(packagePath, 'dist', 'assets', imageValue),
      join(packagePath, imageValue),
    ];

    let imagePath: string | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        imagePath = path;
        break;
      }
    }

    if (!imagePath) {
      this.logger.warn(
        `Image file not found for plugin at ${packagePath}: ${imageValue}`
      );
      return undefined;
    }

    try {
      const imageBuffer = await readFile(imagePath);

      const ext = extname(imagePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
      };

      const mimeType = mimeTypes[ext] || 'image/png';
      const base64 = imageBuffer.toString('base64');
      return toBase64DataUri(mimeType, base64);
    } catch (error) {
      this.logger.error(
        `Failed to read image file ${imagePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return undefined;
    }
  }
}
