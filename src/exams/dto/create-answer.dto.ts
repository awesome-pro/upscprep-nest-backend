import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({
    description: 'ID of the attempt this answer belongs to',
  })
  @IsString()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    description: 'ID of the question being answered',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional({
    description: 'Selected option for MCQ questions (e.g., "a", "b", "c", "d")',
  })
  @IsString()
  @IsOptional()
  selectedOption?: string;

  @ApiPropertyOptional({
    description: 'Text answer for descriptive questions',
  })
  @IsString()
  @MaxLength(10000)
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional({
    description: 'Time spent on the answer',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  timeSpent?: number;
}

export class EvaluateAnswerDto {
  @ApiProperty({
    description: 'Marks awarded for the answer',
  })
  @IsNumber()
  @Min(0)
  marks: number;

  @ApiPropertyOptional({
    description: 'Feedback on the answer',
  })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'Word count of the descriptive answer',
  })
  @IsString()
  @IsOptional()
  evaluationStatus?: string;
}
