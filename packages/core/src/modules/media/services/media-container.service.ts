import { ConfigService } from '@/modules/common/services';
import { SupportedMimeType } from '@longpoint/types';
import { mimeTypeToMediaType } from '@longpoint/utils/media';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { addHours } from 'date-fns';
import {
  selectMediaContainer,
  selectMediaContainerSummary,
} from '../../../shared/selectors/media.selectors';
import { MediaContainerEntity } from '../../common/entities';
import { PrismaService } from '../../common/services/prisma/prisma.service';
import { EventPublisher } from '../../event';
import { UrlSigningService } from '../../file-delivery/services/url-signing.service';
import { StorageUnitService } from '../../storage/services/storage-unit.service';
import { CreateMediaContainerDto } from '../dtos';
import { MediaAssetNotFound, MediaContainerNotFound } from '../media.errors';

export interface CreateMediaContainerParams {
  path: string;
  name?: string;
  mimeType: SupportedMimeType;
  classifiersOnUpload?: string[];
  uploadToken?: {
    token: string;
    expiresAt: Date;
  };
}

/**
 * Service for managing media containers and their associated assets.
 * Handles creation, retrieval, and listing of media containers with support
 * for upload tokens, storage units, and automatic naming.
 */
@Injectable()
export class MediaContainerService {
  private readonly PLACEHOLDER_CONTAINER_NAME = 'New Media';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageUnitService: StorageUnitService,
    private readonly configService: ConfigService,
    private readonly urlSigningService: UrlSigningService,
    private readonly eventPublisher: EventPublisher
  ) {}

  /**
   * Creates a new media container with an associated primary asset and upload token.
   *
   * The container is created in a WAITING_FOR_UPLOAD status initially.
   * An upload token is automatically generated that expires in 1 hour from creation.
   * If a name is provided and a container with that name already exists at the path,
   * a new name will be automatically generated with an increment counter
   * (e.g., "MyFile.jpg", "MyFile.jpg (1)", "MyFile.jpg (2)", etc.).
   *
   * @param data - Parameters for creating the media container
   * @param data.path - The path where the container should be created
   * @param data.name - Optional name for the container. If not provided, a placeholder name will be generated
   * @param data.mimeType - The MIME type of the media file
   * @param data.classifiersOnUpload - Optional array of classifier IDs to run on upload
   *
   * @returns An object containing:
   *   - uploadToken: The generated upload token with expiration date
   *   - container: The created MediaContainerEntity instance
   */
  async createMediaContainer(data: CreateMediaContainerDto) {
    const path = data.path ?? '/';
    const uploadToken = this.generateUploadToken();
    const mediaType = mimeTypeToMediaType(data.mimeType);
    const storageUnit = data.storageUnitId
      ? await this.storageUnitService.getStorageUnitById(data.storageUnitId)
      : await this.storageUnitService.getOrCreateDefaultStorageUnit();

    const container = await this.prismaService.mediaContainer.create({
      data: {
        name: await this.getEffectiveName(path, data.name),
        path,
        type: mediaType,
        status: 'WAITING_FOR_UPLOAD',
        storageUnitId: storageUnit.id,
        assets: {
          create: {
            variant: 'PRIMARY',
            status: 'WAITING_FOR_UPLOAD',
            mimeType: data.mimeType,
            classifiersOnUpload: data.classifiersOnUpload,
            uploadToken: {
              create: {
                token: uploadToken.token,
                expiresAt: uploadToken.expiresAt,
              },
            },
          },
        },
      },
      select: selectMediaContainer(),
    });

    return {
      uploadToken,
      uploadUrl: `${this.configService.get(
        'server.baseUrl'
      )}/media/containers/${container.id}/upload?token=${uploadToken.token}`,
      container: new MediaContainerEntity({
        ...container,
        storageUnit,
        prismaService: this.prismaService,
        pathPrefix: this.configService.get('storage.pathPrefix'),
        urlSigningService: this.urlSigningService,
        eventPublisher: this.eventPublisher,
      }),
    };
  }

  /**
   * Retrieves a media container by its unique identifier.
   *
   * @param id - The unique identifier of the media container
   *
   * @returns The MediaContainerEntity instance
   *
   * @throws {MediaContainerNotFound} If the container does not exist
   */
  async getMediaContainerById(
    id: string
  ): Promise<MediaContainerEntity | null> {
    const container = await this.prismaService.mediaContainer.findUnique({
      where: { id },
      select: selectMediaContainer(),
    });

    if (!container) {
      throw new MediaContainerNotFound(id);
    }

    return new MediaContainerEntity({
      ...container,
      storageUnit: await this.storageUnitService.getStorageUnitByContainerId(
        id
      ),
      prismaService: this.prismaService,
      pathPrefix: this.configService.get('storage.pathPrefix'),
      urlSigningService: this.urlSigningService,
      eventPublisher: this.eventPublisher,
    });
  }

  /**
   * Retrieves a media container by its unique identifier, throwing an error if not found.
   *
   * This is a convenience method that ensures a non-null result. It wraps
   * getMediaContainerById and throws if the result is null.
   *
   * @param id - The unique identifier of the media container
   *
   * @returns The MediaContainerEntity instance (guaranteed to be non-null)
   *
   * @throws {MediaContainerNotFound} If the container does not exist
   */
  async getMediaContainerByIdOrThrow(
    id: string
  ): Promise<MediaContainerEntity> {
    const container = await this.getMediaContainerById(id);
    if (!container) {
      throw new MediaContainerNotFound(id);
    }
    return container;
  }

  /**
   * Retrieves a media container by its path and name combination.
   *
   * The path and name together form a unique identifier for containers.
   *
   * @param path - The path of the container
   * @param name - The name of the container
   *
   * @returns The MediaContainerEntity if found, or null if not found
   */
  async getMediaContainerByPathName(
    path: string,
    name: string
  ): Promise<MediaContainerEntity | null> {
    const container = await this.prismaService.mediaContainer.findUnique({
      where: {
        path_name: { path, name },
      },
      select: selectMediaContainer(),
    });

    if (!container) {
      return null;
    }

    return new MediaContainerEntity({
      ...container,
      storageUnit: await this.storageUnitService.getStorageUnitByContainerId(
        container.id
      ),
      prismaService: this.prismaService,
      pathPrefix: this.configService.get('storage.pathPrefix'),
      urlSigningService: this.urlSigningService,
      eventPublisher: this.eventPublisher,
    });
  }

  async getMediaContainerByAssetId(
    assetId: string
  ): Promise<MediaContainerEntity | null> {
    const asset = await this.prismaService.mediaAsset.findUnique({
      where: { id: assetId },
      select: {
        containerId: true,
      },
    });

    if (!asset) {
      return null;
    }

    return this.getMediaContainerById(asset.containerId);
  }

  async getMediaContainerByAssetIdOrThrow(
    assetId: string
  ): Promise<MediaContainerEntity> {
    const container = await this.getMediaContainerByAssetId(assetId);
    if (!container) {
      throw new MediaAssetNotFound(assetId);
    }
    return container;
  }

  /**
   * Lists all media containers that are located at or under the specified path.
   *
   * Only returns containers that have not been deleted (deletedAt is null).
   * Uses a prefix match, so containers in subdirectories are included.
   *
   * @param path - The path prefix to search for containers
   *
   * @returns An array of MediaContainerEntity instances matching the path
   */
  async listContainersByPath(path: string): Promise<MediaContainerEntity[]> {
    const containers = await this.prismaService.mediaContainer.findMany({
      where: {
        path: { startsWith: path },
        deletedAt: null,
      },
      select: selectMediaContainerSummary(),
    });

    const entities = await Promise.all(
      containers.map(
        async (container) =>
          new MediaContainerEntity({
            ...container,
            storageUnit:
              await this.storageUnitService.getStorageUnitByContainerId(
                container.id
              ),
            prismaService: this.prismaService,
            pathPrefix: this.configService.get('storage.pathPrefix'),
            urlSigningService: this.urlSigningService,
            eventPublisher: this.eventPublisher,
          })
      )
    );

    return entities;
  }

  /**
   * Lists media containers by their unique identifiers.
   *
   * @param ids - The unique identifiers of the media containers
   *
   * @returns An array of MediaContainerEntity instances matching the IDs
   */
  async listContainersByIds(ids: string[]): Promise<MediaContainerEntity[]> {
    const containers = await this.prismaService.mediaContainer.findMany({
      where: { id: { in: ids } },
      select: {
        ...selectMediaContainerSummary(),
        storageUnitId: true,
      },
    });

    const entities = await Promise.all(
      containers.map(
        async (container) =>
          new MediaContainerEntity({
            ...container,
            storageUnit: await this.storageUnitService.getStorageUnitById(
              container.storageUnitId
            ),
            prismaService: this.prismaService,
            pathPrefix: this.configService.get('storage.pathPrefix'),
            urlSigningService: this.urlSigningService,
            eventPublisher: this.eventPublisher,
          })
      )
    );

    return entities;
  }
  /**
   * Determines the effective name to use for a media container.
   *
   * If a name is provided, it checks for conflicts and automatically generates
   * a new name with an increment counter if a container with the same path and
   * name already exists (e.g., "MyFile.jpg", "MyFile.jpg (1)", "MyFile.jpg (2)", etc.).
   * If no name is provided, generates a placeholder name by finding the next available
   * sequential placeholder name (e.g., "placeholder", "placeholder 1", "placeholder 2", etc.).
   *
   * @param path - The path where the container will be created (defaults to '/')
   * @param name - Optional explicit name for the container
   *
   * @returns The effective name to use for the container
   *
   * @throws {Error} If the maximum number of containers (9999) is exceeded
   */
  private async getEffectiveName(path = '/', name?: string) {
    if (name) {
      const existingContainer =
        await this.prismaService.mediaContainer.findUnique({
          where: {
            path_name: {
              path,
              name,
            },
          },
        });

      if (!existingContainer) {
        return name;
      }

      const counterPattern = /^(.+?)\s+\((\d+)\)$/;
      const match = name.match(counterPattern);
      const baseName = match ? match[1] : name;

      const allContainers = await this.prismaService.mediaContainer.findMany({
        where: {
          path,
          name: {
            startsWith: baseName,
          },
        },
        select: {
          name: true,
        },
      });

      const existingCounters = new Set<number>();

      if (allContainers.some((c) => c.name === baseName)) {
        existingCounters.add(0);
      }

      // Extract counters from names like "baseName (1)", "baseName (2)", etc.
      for (const container of allContainers) {
        const containerMatch = container.name.match(counterPattern);
        if (containerMatch && containerMatch[1] === baseName) {
          const counter = parseInt(containerMatch[2], 10);
          existingCounters.add(counter);
        }
      }

      let counter = 1;
      const MAX_COUNTER = 9999;

      while (counter <= MAX_COUNTER && existingCounters.has(counter)) {
        counter++;
      }

      if (counter > MAX_COUNTER) {
        throw new Error(
          `Maximum number of containers (${MAX_COUNTER}) exceeded for name "${baseName}" at path: ${path}`
        );
      }

      return `${baseName} (${counter})`;
    }

    const containers = await this.prismaService.mediaContainer.findMany({
      where: {
        path,
        name: {
          startsWith: this.PLACEHOLDER_CONTAINER_NAME,
        },
      },
    });

    let counter = 1;
    const MAX_COUNTER = 9999;
    const containerNames = new Set<string>(containers.map((c) => c.name));

    const baseExists = containerNames.has(this.PLACEHOLDER_CONTAINER_NAME);

    if (!baseExists) {
      return this.PLACEHOLDER_CONTAINER_NAME;
    } else {
      while (
        counter <= MAX_COUNTER &&
        containerNames.has(`${this.PLACEHOLDER_CONTAINER_NAME} ${counter}`)
      ) {
        counter++;
      }

      if (counter > MAX_COUNTER) {
        throw new Error(
          `Maximum number of placeholder containers (${MAX_COUNTER}) exceeded for path: ${path}`
        );
      }

      return `${this.PLACEHOLDER_CONTAINER_NAME} ${counter}`;
    }
  }

  /**
   * Generates a secure upload token with a 1-hour expiration.
   *
   * The token is a cryptographically secure random 32-byte hex string.
   * The expiration time is set to 1 hour from the current time.
   *
   * @returns An object containing:
   *   - token: A random hex string (64 characters)
   *   - expiresAt: The expiration date/time (1 hour from now)
   */
  private generateUploadToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 1);
    return { token, expiresAt };
  }
}
