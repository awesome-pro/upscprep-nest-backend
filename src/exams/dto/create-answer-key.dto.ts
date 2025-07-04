import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAnswerKeyDto {
  @ApiProperty({ description: 'Exam ID this answer key belongs to' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({
    description: 'Version of the answer key (e.g., Set A, Set B)',
    example: 'Set A',
  })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({
    description: 'JSON data containing correct answers and explanations',
    example:
      '{"1": {"answer": "B", "explanation": "New Delhi is the capital of India"}, "2": {"answer": "C", "explanation": "Article 370 was abrogated in 2019"}}',
  })
  @IsJSON()
  answerData: string;

  @ApiPropertyOptional({
    description: 'Whether this is an official answer key',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isOfficial?: boolean;
}
