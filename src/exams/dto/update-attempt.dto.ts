import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from 'generated/prisma';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsJSON,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAttemptDto } from './create-attempt.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAttemptDto extends PartialType(CreateAttemptDto) {
  @ApiPropertyOptional({
    description: 'Status of the attempt',
    enum: AttemptStatus,
  })
  @IsEnum(AttemptStatus)
  @IsOptional()
  status?: AttemptStatus;

  @ApiPropertyOptional({ description: 'End time of the attempt' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({ description: 'Submit time of the attempt' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  submitTime?: Date;

  @ApiPropertyOptional({ description: 'Score achieved' })
  @IsInt()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ description: 'Percentage achieved' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({ description: 'Rank achieved' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  rank?: number;

  @ApiPropertyOptional({ description: 'Number of correct answers' })
  @IsInt()
  @Min(0)
  @IsOptional()
  correctAnswers?: number;

  @ApiPropertyOptional({ description: 'Number of incorrect answers' })
  @IsInt()
  @Min(0)
  @IsOptional()
  incorrectAnswers?: number;

  @ApiPropertyOptional({ description: 'Number of unattempted questions' })
  @IsInt()
  @Min(0)
  @IsOptional()
  unattempted?: number;

  @ApiPropertyOptional({ description: 'Accuracy percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  accuracy?: number;

  @ApiPropertyOptional({ description: 'URL to the answer sheet' })
  @IsString()
  @IsOptional()
  answerSheetUrl?: string;

  @ApiPropertyOptional({
    description: 'Evaluation status',
    example: 'Pending',
  })
  @IsString()
  @IsOptional()
  evaluationStatus?: string;

  @ApiPropertyOptional({
    description: 'Feedback from evaluator',
    example:
      '{"content": "Good analysis of the topic", "structure": "Well organized"}',
  })
  @IsJSON()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'ID of the evaluator',
  })
  @IsString()
  @IsOptional()
  evaluatedBy?: string;

  @ApiPropertyOptional({
    description: 'Time spent on each question/section',
    example: 120,
  })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}
