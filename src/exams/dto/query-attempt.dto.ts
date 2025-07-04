import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from 'generated/prisma';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryAttemptDto {
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

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by exam ID' })
  @IsString()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({ description: 'Filter by purchase ID' })
  @IsString()
  @IsOptional()
  purchaseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by attempt status',
    enum: AttemptStatus,
  })
  @IsEnum(AttemptStatus)
  @IsOptional()
  status?: AttemptStatus;

  @ApiPropertyOptional({ description: 'Filter by search' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by evaluation status' })
  @IsString()
  @IsOptional()
  evaluationStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by evaluator ID' })
  @IsString()
  @IsOptional()
  evaluatedBy?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'score' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
