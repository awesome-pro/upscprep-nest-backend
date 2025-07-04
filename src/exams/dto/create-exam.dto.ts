import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamDifficulty, ExamType, TestType } from 'generated/prisma';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsJSON,
  IsNegative,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MarkingSchemeDto {
  @ApiProperty({ description: 'Points for correct answer', example: 2 })
  @IsNumber()
  @IsPositive()
  correct: number;

  @ApiProperty({
    description: 'Points deducted for incorrect answer',
    example: -0.66,
  })
  @IsNumber()
  incorrect: number;
}

export class CreateExamDto {
  // @ApiProperty({
  //   description: 'Title of the exam',
  //   example: 'UPSC Prelims Mock Test - June 2025',
  // })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  // @ApiPropertyOptional({ description: 'Description of the exam' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  // @ApiProperty({
  //   description: 'Type of exam',
  //   enum: ExamType,
  //   example: ExamType.PRELIMS,
  // })
  @IsEnum(ExamType)
  type: ExamType;

  // @ApiProperty({
  //   description: 'Test type',
  //   enum: TestType,
  //   example: TestType.FULL_LENGTH,
  // })
  @IsEnum(TestType)
  testType: TestType;

  // @ApiPropertyOptional({
  //   description: 'Subject of the exam',
  //   example: 'General Studies Paper I',
  // })
  @IsString()
  @IsOptional()
  subject?: string;

  // @ApiPropertyOptional({
  //   description: 'Test series ID if this exam belongs to a series',
  // })
  @IsString()
  @IsOptional()
  testSeriesId?: string;

  // @ApiProperty({
  //   description: 'Array of file URLs for exam materials',
  //   type: [String],
  //   example: ['https://example.com/exam-paper.pdf'],
  // })
  @IsArray()
  @IsString({ each: true })
  fileUrls: string[];

  // @ApiPropertyOptional({
  //   description: 'JSON data containing questions',
  //   example:
  //     '{"questions": [{"id": 1, "text": "What is the capital of India?", "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"], "correctAnswer": 1}]}',
  // })
  @IsJSON()
  @IsOptional()
  questionData?: string;

  // @ApiProperty({
  //   description: 'Duration of the exam in minutes',
  //   example: 180,
  // })
  @IsInt()
  @Min(1)
  duration: number;

  // @ApiProperty({
  //   description: 'Total marks for the exam',
  //   example: 200,
  // })
  @IsInt()
  @IsPositive()
  totalMarks: number;

  // @ApiProperty({
  //   description: 'Whether negative marking is applicable',
  //   example: true,
  // })
  @IsBoolean()
  negativeMarking: boolean;

  @IsInt()
  @IsPositive()
  correctMark: number;

  @IsInt()
  @IsNegative()
  incorrectMark: number;

  // @ApiPropertyOptional({
  //   description: 'Difficulty level of the exam',
  //   example: 'Medium',
  //   enum: ['Easy', 'Medium', 'Hard'],
  // })
  @IsEnum(ExamDifficulty)
  @IsOptional()
  difficulty?: ExamDifficulty;

  // @ApiPropertyOptional({
  //   description: 'Tags for categorizing the exam',
  //   type: [String],
  //   example: ['Polity', 'Current Affairs'],
  // })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // @ApiProperty({
  //   description: 'Whether the exam is active',
  //   example: true,
  // })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // @ApiProperty({
  //   description: 'Whether the exam is free',
  //   example: false,
  // })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  // @ApiProperty({
  //   description: 'Cost of the exam in paisa',
  //   example: 19900,
  // })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalQuestions?: number;
}
