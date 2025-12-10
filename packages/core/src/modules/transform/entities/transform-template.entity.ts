import { AssetService, AssetVariantEntity } from '@/modules/asset';
import { PrismaService } from '@/modules/common/services';
import { ConfigValues } from '@longpoint/config-schema';
import { formatDuration } from '@longpoint/utils/format';
import { Logger } from '@nestjs/common';
import { TransformTemplateDto, UpdateTransformTemplateDto } from '../dtos';
import { TransformTemplateNotFound } from '../transform.errors';
import {
  SelectedTransformTemplate,
  selectTransformTemplate,
} from '../transform.selectors';
import { TransformerEntity } from './transformer.entity';

export interface TransformTemplateEntityArgs extends SelectedTransformTemplate {
  transformer: TransformerEntity;
  prismaService: PrismaService;
  assetService: AssetService;
}

export class TransformTemplateEntity {
  readonly id: string;
  private _name: string;
  private _displayName: string | null;
  private _description: string | null;
  private _inputFromDb: ConfigValues | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _transformer: TransformerEntity;

  private readonly prismaService: PrismaService;
  private readonly assetService: AssetService;
  private readonly logger = new Logger(TransformTemplateEntity.name);

  constructor(args: TransformTemplateEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._displayName = args.displayName;
    this._description = args.description;
    this._inputFromDb = args.input as ConfigValues;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.prismaService = args.prismaService;
    this.assetService = args.assetService;
    this._transformer = args.transformer;
  }

  async transformAssetVariant(sourceVariantId: string) {
    const sourceVariant = await this.assetService.getAssetVariantByIdOrThrow(
      sourceVariantId
    );
    const dto = sourceVariant.toDto();

    this.logger.log(
      `Transforming asset variant '${sourceVariantId}' with template '${this.name}'`
    );
    const startTime = Date.now();
    const source = { url: dto.url!, mimeType: sourceVariant.mimeType };
    const input = await this._transformer.processInputFromDb(
      this._inputFromDb ?? {}
    );
    const handshakeResult = await this._transformer.handshake({
      source,
      input,
    });
    const variantMap = new Map<string, AssetVariantEntity>();

    for (const variant of handshakeResult.variants) {
      const variantEntity = await this.assetService.createDerivativeVariant({
        assetId: sourceVariant.assetId,
        displayName: this.displayName,
        mimeType: variant.mimeType,
        entryPoint: variant.entryPoint,
      });
      variantMap.set(variantEntity.id, variantEntity);
    }

    const variantsForTransformer = await Promise.all(
      Array.from(variantMap.values()).map(async (variant) => ({
        id: variant.id,
        mimeType: variant.mimeType,
        entryPoint: variant.entryPoint,
        fileOperations: await variant.getStorageUnitOperations(),
      }))
    );

    try {
      const transformResult = await this._transformer.transform({
        input,
        source,
        variants: variantsForTransformer,
      });

      for (const variant of transformResult.variants) {
        const variantEntity = variantMap.get(variant.id);
        if (!variantEntity) {
          this.logger.warn(
            `Unexpected variant ID returned from transformer: ${variant.id} - skipping`
          );
          continue;
        }
        if (variant.error) {
          await variantEntity.update({ status: 'FAILED' });
          this.logger.warn(
            `Transform template "${this.name}" failed to process variant "${variant.id}": ${variant.error}`
          );
          continue;
        }
        await variantEntity.syncSize();
        await variantEntity.update({ status: 'READY' });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      this.logger.log(
        `Transform completed in ${formatDuration(duration / 1000, 'compact')}`
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      const stackTrace = e instanceof Error ? e.stack : undefined;
      this.logger.error(
        `Transform template "${this.name}" failed: ${errorMessage}`,
        stackTrace
      );
      for (const variant of variantMap.values()) {
        await variant.update({ status: 'FAILED' });
      }
    }
  }

  async update(data: UpdateTransformTemplateDto) {
    const updatedTransformTemplate =
      await this.prismaService.transformTemplate.update({
        where: {
          id: this.id,
        },
        data: {
          name: data.name,
          description: data.description,
          input: data.input
            ? await this._transformer.processInput(data.input)
            : undefined,
        },
        select: selectTransformTemplate(),
      });

    this._name = updatedTransformTemplate.name;
    this._description = updatedTransformTemplate.description;
    this._inputFromDb = updatedTransformTemplate.input as ConfigValues;
    this._updatedAt = updatedTransformTemplate.updatedAt;
    this._createdAt = updatedTransformTemplate.createdAt;
  }

  async delete() {
    try {
      await this.prismaService.transformTemplate.delete({
        where: {
          id: this.id,
        },
      });
    } catch (e) {
      if (PrismaService.isNotFoundError(e)) {
        throw new TransformTemplateNotFound(this.id);
      }
      throw e;
    }
  }

  async toDto(): Promise<TransformTemplateDto> {
    return new TransformTemplateDto({
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      transformerId: this._transformer.id,
      input: await this._transformer.processInputFromDb(
        this._inputFromDb ?? {}
      ),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      supportedMimeTypes: this.supportedMimeTypes,
    });
  }

  get name(): string {
    return this._name;
  }

  get displayName(): string {
    return this._displayName ?? this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get supportedMimeTypes(): string[] {
    return this._transformer.supportedMimeTypes;
  }
}
