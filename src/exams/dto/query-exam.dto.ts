import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExamType, TestType } from 'generated/prisma';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryExamDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by exam type', enum: ExamType })
  @IsEnum(ExamType)
  @IsOptional()
  type?: ExamType;

  @ApiPropertyOptional({ description: 'Filter by test type', enum: TestType })
  @IsEnum(TestType)
  @IsOptional()
  testType?: TestType;

  @ApiPropertyOptional({ description: 'Filter by subject' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Filter by test series ID' })
  @IsString()
  @IsOptional()
  testSeriesId?: string;

  @ApiPropertyOptional({ description: 'Filter by teacher ID' })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Filter by difficulty' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by free exams' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isFree?: boolean;
}
