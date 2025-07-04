import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExamDifficulty, QuestionType } from 'generated/prisma';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryQuestionDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Search term for question text',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by exam ID',
  })
  @IsString()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({
    description: 'Filter by question type',
    enum: QuestionType,
  })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: ExamDifficulty,
  })
  @IsEnum(ExamDifficulty)
  @IsOptional()
  difficulty?: ExamDifficulty;

  @ApiPropertyOptional({
    description: 'Filter by topic',
  })
  @IsString()
  @IsOptional()
  topic?: string;
}
