import { PrismaService } from '@/modules/common/services';
import { ConfigValues } from '@longpoint/config-schema';
import { TransformTemplateDto, UpdateTransformTemplateDto } from '../dtos';
import { TransformTemplateNotFound } from '../transform.errors';
import {
  SelectedTransformTemplate,
  selectTransformTemplate,
} from '../transform.selectors';
import { TransformerEntity } from './transformer.entity';

export interface TransformTemplateEntityArgs extends SelectedTransformTemplate {
  prismaService: PrismaService;
  transformer: TransformerEntity;
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

  constructor(args: TransformTemplateEntityArgs) {
    this.id = args.id;
    this._name = args.name;
    this._displayName = args.displayName;
    this._description = args.description;
    this._inputFromDb = args.input as ConfigValues;
    this._createdAt = args.createdAt;
    this._updatedAt = args.updatedAt;
    this.prismaService = args.prismaService;
    this._transformer = args.transformer;
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
}
