import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamType } from 'generated/prisma';
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
} from 'class-validator';

export class CreateTestSeriesDto {
  @ApiProperty({
    description: 'Title of the test series',
    example: 'UPSC Prelims 2025 Complete Test Series',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the test series',
    example:
      'Comprehensive test series covering all topics for UPSC Prelims 2025',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    description: 'Type of exam',
    enum: ExamType,
    example: ExamType.PRELIMS,
  })
  @IsEnum(ExamType)
  type: ExamType;

  @ApiProperty({
    description: 'Price of the test series in paisa',
    example: 499900,
  })
  @IsInt()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    description: 'Whether the test series is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Features for the test series',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Images for the test series',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Exams for the test series',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  examIds: string[];
}
