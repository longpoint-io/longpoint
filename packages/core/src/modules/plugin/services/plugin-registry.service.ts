import {
  AiPluginConfig,
  AiPluginManifest,
  ClassifierContribution,
  LongpointPluginConfig,
  PluginConfig,
  StorageContribution,
  VectorContribution,
  VectorPluginConfig,
  VectorPluginManifest,
} from '@longpoint/devkit';
import { findNodeModulesPath } from '@longpoint/utils/path';
import { toBase64DataUri } from '@longpoint/utils/string';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { createRequire } from 'module';
import { extname, join } from 'path';

export type PluginType = 'ai' | 'vector';

export type ManifestForType<T extends PluginType> = T extends 'ai'
  ? AiPluginManifest
  : T extends 'vector'
  ? VectorPluginManifest
  : never;

export type ConfigForType<T extends PluginType> = T extends 'ai'
  ? AiPluginConfig
  : T extends 'vector'
  ? VectorPluginConfig
  : never;

export interface PluginRegistryEntry<T extends PluginType = PluginType> {
  packageName: string;
  packagePath: string;
  manifest: ManifestForType<T>;
  type: T;
  provider: ConfigForType<T>['provider'];
  derivedId: string;
}

export interface ClassificationProviderRegistryEntry {
  packageName: string;
  packagePath: string;
  pluginId: string;
  classifierId: string;
  fullyQualifiedId: string;
  contribution: ClassifierContribution<any>;
  pluginConfig: LongpointPluginConfig<any>;
}

export interface VectorProviderRegistryEntry {
  packageName: string;
  packagePath: string;
  pluginId: string;
  vectorId: string;
  fullyQualifiedId: string;
  contribution: VectorContribution<any>;
  pluginConfig: LongpointPluginConfig<any>;
}

export interface StorageProviderRegistryEntry {
  packageName: string;
  packagePath: string;
  pluginId: string;
  storageId: string;
  fullyQualifiedId: string;
  contribution: StorageContribution<any>;
  pluginConfig: LongpointPluginConfig<any>;
}

@Injectable()
export class PluginRegistryService implements OnModuleInit {
  private readonly logger = new Logger(PluginRegistryService.name);
  private readonly pluginRegistry = new Map<string, PluginRegistryEntry>();
  private readonly classificationProviderRegistry = new Map<
    string,
    ClassificationProviderRegistryEntry
  >();
  private readonly vectorProviderRegistry = new Map<
    string,
    VectorProviderRegistryEntry
  >();
  private readonly storageProviderRegistry = new Map<
    string,
    StorageProviderRegistryEntry
  >();

  async onModuleInit() {
    await this.discoverAllPlugins();
  }

  /**
   * Get all plugins of a specific type.
   * @param type - The plugin type (ai, vector)
   * @returns Array of plugin registry entries with strongly typed manifests
   */
  listPlugins<T extends PluginType>(type: T): PluginRegistryEntry<T>[] {
    return Array.from(this.pluginRegistry.values())
      .filter((entry) => entry.type === type)
      .map((entry) => entry as PluginRegistryEntry<T>);
  }

  /**
   * Get a specific plugin by its derived ID.
   * @param id - The derived plugin ID (e.g., 's3', 'openai', 'pinecone')
   * @returns The plugin registry entry or null if not found
   */
  getPluginById<T extends PluginType>(
    id: string
  ): PluginRegistryEntry<T> | null {
    return this.pluginRegistry.get(id) as PluginRegistryEntry<T> | null;
  }

  /**
   * Get all classification providers.
   * @returns Array of classification provider registry entries
   */
  listClassificationProviders(): ClassificationProviderRegistryEntry[] {
    return Array.from(this.classificationProviderRegistry.values());
  }

  /**
   * Get a classification provider by its fully qualified ID (e.g., 'openai/gpt-5-nano-2025-08-07').
   * @param id - The fully qualified classification provider ID
   * @returns The classification provider registry entry or null if not found
   */
  getClassificationProviderById(
    id: string
  ): ClassificationProviderRegistryEntry | null {
    return this.classificationProviderRegistry.get(id) || null;
  }

  /**
   * Get all vector providers.
   * @returns Array of vector provider registry entries
   */
  listVectorProviders(): VectorProviderRegistryEntry[] {
    return Array.from(this.vectorProviderRegistry.values());
  }

  /**
   * Get a vector provider by its fully qualified ID (e.g., 'pinecone/pinecone').
   * @param id - The fully qualified vector provider ID
   * @returns The vector provider registry entry or null if not found
   */
  getVectorProviderById(id: string): VectorProviderRegistryEntry | null {
    return this.vectorProviderRegistry.get(id) || null;
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

    this.logger.log(
      `${this.pluginRegistry.size} plugins loaded, ${this.classificationProviderRegistry.size} classification providers loaded, ${this.vectorProviderRegistry.size} vector providers loaded, ${this.storageProviderRegistry.size} storage providers loaded`
    );
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

    // Check if it's a LongpointPluginConfig (new format)
    if (this.isLongpointPluginConfig(pluginExport)) {
      await this.loadLongpointPlugin(packageName, packagePath, pluginExport);
      return;
    }

    // Otherwise, treat it as a legacy PluginConfig
    const pluginConfig: PluginConfig = pluginExport;

    if (!pluginConfig.type) {
      this.logger.error(`Plugin ${packageName} has no type`);
      return;
    }

    if (!pluginConfig.provider) {
      this.logger.error(`Plugin ${packageName} has an invalid provider class`);
      return;
    }

    if (!pluginConfig.manifest) {
      this.logger.error(`Plugin ${packageName} has an invalid manifest`);
      return;
    }

    const derivedId = this.derivePluginId(packageName);

    const processedManifest = await this.processManifest(
      pluginConfig.manifest,
      packagePath
    );

    this.pluginRegistry.set(derivedId, {
      packageName,
      packagePath,
      manifest: processedManifest,
      type: pluginConfig.type,
      provider: pluginConfig.provider,
      derivedId,
    });

    this.logger.debug(`Loaded plugin: ${derivedId} (${packageName})`);
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
   * Load a LongpointPluginConfig plugin and extract classification providers, vector providers, and storage providers.
   */
  private async loadLongpointPlugin(
    packageName: string,
    packagePath: string,
    pluginConfig: LongpointPluginConfig<any>
  ) {
    const pluginId = this.derivePluginId(packageName);

    // Process icon if present
    let processedIcon: string | undefined;
    if (pluginConfig.icon) {
      processedIcon = await this.processImage(pluginConfig.icon, packagePath);
    }

    const processedPluginConfig = {
      ...pluginConfig,
      icon: processedIcon,
    };

    // Extract classification providers
    if (pluginConfig.contributes?.classifiers) {
      for (const [classifierId, contribution] of Object.entries(
        pluginConfig.contributes.classifiers
      )) {
        const fullyQualifiedId = `${pluginId}/${classifierId}`;

        this.classificationProviderRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          classifierId,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });

        this.logger.debug(
          `Loaded classification provider: ${fullyQualifiedId} (${packageName})`
        );
      }
    }

    // Extract vector providers
    if (pluginConfig.contributes?.vector) {
      for (const [vectorId, contribution] of Object.entries(
        pluginConfig.contributes.vector
      )) {
        const fullyQualifiedId = `${pluginId}/${vectorId}`;

        this.vectorProviderRegistry.set(fullyQualifiedId, {
          packageName,
          packagePath,
          pluginId,
          vectorId,
          fullyQualifiedId,
          contribution,
          pluginConfig: processedPluginConfig,
        });

        this.logger.debug(
          `Loaded vector provider: ${fullyQualifiedId} (${packageName})`
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
  }

  /**
   * Process a manifest, handling image conversion for AI and Vector plugins.
   * @param manifest - The manifest to process
   * @param type - The plugin type
   * @param packagePath - The path to the plugin package
   * @returns The processed manifest
   */
  private async processManifest(
    manifest: any,
    packagePath: string
  ): Promise<any> {
    if (manifest.image) {
      const processedImage = await this.processImage(
        manifest.image,
        packagePath
      );
      if (processedImage) {
        return {
          ...manifest,
          image: processedImage,
        };
      }
    }

    return manifest;
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
    // If it's already a URL, return it as is
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
      return imageValue;
    }

    // Try to find the image file in the package
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
      // Read the image file
      const imageBuffer = await readFile(imagePath);

      // Determine MIME type from file extension
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

      // Convert to base64 data URI
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
