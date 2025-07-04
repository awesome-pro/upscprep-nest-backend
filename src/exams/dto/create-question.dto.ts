import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamDifficulty, QuestionType } from 'generated/prisma';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class MCQOptionDto {
  @ApiProperty({
    description: 'Option identifier (e.g., "a", "b", "c", "d")',
    example: 'a',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Option text', example: 'New Delhi' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Exam ID this question belongs to' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MCQ,
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    description: 'Question number in the exam',
    example: 1,
  })
  @IsInt()
  @Min(1)
  questionNumber: number;

  @ApiProperty({
    description: 'Question text (supports markdown)',
    example: 'What is the capital of India?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;

  @ApiProperty({
    description: 'Marks allocated to this question',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  marks: number;

  // MCQ specific fields
  @ApiProperty({
    description: 'Options for MCQ questions',
    type: [MCQOptionDto],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    description: 'ID of the correct option for MCQ',
    example: 'b',
    required: false,
  })
  @IsString()
  @ValidateIf((o) => o.type === QuestionType.MCQ)
  correctOption?: string;

  @ApiPropertyOptional({
    description: 'Explanation for the correct answer',
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  // Descriptive specific fields
  @ApiPropertyOptional({
    description: 'Key points expected in the descriptive answer',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((o) => o.type === QuestionType.DESCRIPTIVE)
  expectedAnswerPoints?: string[];

  @ApiPropertyOptional({
    description: 'Word limit for descriptive answers',
    example: 250,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @ValidateIf((o) => o.type === QuestionType.DESCRIPTIVE)
  wordLimit?: number;

  @ApiPropertyOptional({
    description: 'Model answer for reference',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.type === QuestionType.DESCRIPTIVE)
  modelAnswer?: string;

  // Common fields
  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    enum: ExamDifficulty,
    default: ExamDifficulty.MEDIUM,
  })
  @IsEnum(ExamDifficulty)
  @IsOptional()
  difficulty?: ExamDifficulty;

  @ApiPropertyOptional({
    description: 'Topic or subject area this question belongs to',
    example: 'Indian Polity',
  })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({
    description: 'URLs to images used in the question',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({
    description: 'Whether the question is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
