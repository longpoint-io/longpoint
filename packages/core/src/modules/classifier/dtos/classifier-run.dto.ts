import { ClassifierRun, ClassifierRunStatus } from '@/database';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { JsonObject } from '../../../shared/types/object.types';
import { type SelectedClassifierRun } from '../classifier.selectors';
import {
  ClassifierTemplateShortDto,
  ClassifierTemplateShortParams,
} from './classifier-template-short.dto';

export interface ClassifierRunParams
  extends Pick<
    ClassifierRun,
    | 'id'
    | 'status'
    | 'result'
    | 'errorMessage'
    | 'createdAt'
    | 'startedAt'
    | 'completedAt'
  > {
  classifierTemplate: ClassifierTemplateShortParams;
}

@ApiSchema({ name: 'ClassifierRun' })
export class ClassifierRunDto {
  @ApiProperty({
    description: 'The ID of the classifier run',
    example: 'r2qwyd76nvd98cu6ewg8ync2',
  })
  id: string;

  @ApiProperty({
    description: 'The status of the classifier run',
    example: ClassifierRunStatus.SUCCESS,
    enum: ClassifierRunStatus,
  })
  status: ClassifierRunStatus;

  @ApiProperty({
    description: 'The result of the classifier run',
    example: {
      tags: ['person', 'car', 'tree'],
    },
    type: 'object',
    additionalProperties: true,
  })
  result: JsonObject | null;

  @ApiProperty({
    description: 'The error message of the classifier run',
    example: 'An error occurred while running the classifier',
    nullable: true,
    type: 'string',
  })
  errorMessage: string | null;

  @ApiProperty({
    description: 'When the classifier run was created',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the classifier run started',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  startedAt: Date | null;

  @ApiProperty({
    description: 'When the classifier run completed',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
    type: 'string',
  })
  completedAt: Date | null;

  @ApiProperty({
    description:
      'The classifier template that was used to run the classifier run',
    type: ClassifierTemplateShortDto,
  })
  classifierTemplate: ClassifierTemplateShortDto;

  constructor(data: SelectedClassifierRun) {
    this.id = data.id;
    this.status = data.status;
    this.result = data.result as JsonObject | null;
    this.errorMessage = data.errorMessage;
    this.createdAt = data.createdAt;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.classifierTemplate = new ClassifierTemplateShortDto(
      data.classifierTemplate
    );
  }
}
