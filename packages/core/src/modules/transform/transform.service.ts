import { Prisma } from '@/database';
import { PaginationQueryDto } from '@/shared/dtos';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services';
import { CreateTransformTemplateDto } from './dtos';
import { TransformTemplateEntity } from './entities/transform-template.entity';
import { TransformTemplateNotFound } from './transform.errors';
import { selectTransformTemplate } from './transform.selectors';

@Injectable()
export class TransformService {
  constructor(private readonly prismaService: PrismaService) {}

  async createTransformTemplate(data: CreateTransformTemplateDto) {
    const transformTemplate = await this.prismaService.transformTemplate.create(
      {
        data: {
          name: data.name,
          description: data.description,
          input: data.input,
        },
        select: selectTransformTemplate(),
      }
    );

    return new TransformTemplateEntity({
      ...transformTemplate,
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

    return new TransformTemplateEntity({
      ...transformTemplate,
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

    return transformTemplates.map(
      (template) =>
        new TransformTemplateEntity({
          ...template,
          prismaService: this.prismaService,
        })
    );
  }
}
