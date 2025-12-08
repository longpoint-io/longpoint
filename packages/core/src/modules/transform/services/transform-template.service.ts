import { Prisma } from '@/database';
import { PaginationQueryDto } from '@/shared/dtos';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services';
import { CreateTransformTemplateDto } from '../dtos';
import { TransformTemplateEntity } from '../entities/transform-template.entity';
import { TransformTemplateNotFound } from '../transform.errors';
import { selectTransformTemplate } from '../transform.selectors';
import { TransformerService } from './transformer.service';

@Injectable()
export class TransformTemplateService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly transformerService: TransformerService
  ) {}

  async createTransformTemplate(data: CreateTransformTemplateDto) {
    const transformer = await this.transformerService.getTransformerByIdOrThrow(
      data.transformerId
    );
    const transformTemplate = await this.prismaService.transformTemplate.create(
      {
        data: {
          name: data.name,
          description: data.description,
          transformerId: data.transformerId,
          input: data.input,
        },
        select: selectTransformTemplate(),
      }
    );

    return new TransformTemplateEntity({
      ...transformTemplate,
      transformer,
      prismaService: this.prismaService,
    });
  }

  async getTransformTemplateById(id: string) {
    const transformTemplate =
      await this.prismaService.transformTemplate.findUnique({
        where: { id },
        select: selectTransformTemplate(),
      });

    if (!transformTemplate) {
      return null;
    }

    const transformer = await this.transformerService.getTransformerByIdOrThrow(
      transformTemplate.transformerId
    );

    return new TransformTemplateEntity({
      ...transformTemplate,
      transformer,
      prismaService: this.prismaService,
    });
  }

  async getTransformTemplateByIdOrThrow(id: string) {
    const transformTemplate = await this.getTransformTemplateById(id);
    if (!transformTemplate) {
      throw new TransformTemplateNotFound(id);
    }
    return transformTemplate;
  }

  async listTransformTemplates(query: PaginationQueryDto) {
    const transformTemplates =
      await this.prismaService.transformTemplate.findMany({
        ...query.toPrisma(),
        select: selectTransformTemplate(),
        orderBy: {
          name: Prisma.SortOrder.asc,
        },
      });

    const transformers = await Promise.all(
      transformTemplates.map((template) =>
        this.transformerService.getTransformerByIdOrThrow(
          template.transformerId
        )
      )
    );

    return transformTemplates.map(
      (template, index) =>
        new TransformTemplateEntity({
          ...template,
          transformer: transformers[index],
          prismaService: this.prismaService,
        })
    );
  }
}
