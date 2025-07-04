import { ApiProperty } from '@nestjs/swagger';
import { CourseType } from 'generated/prisma';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Course description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Course type', enum: CourseType })
  @IsEnum(CourseType)
  @IsOptional()
  type?: CourseType;

  @ApiProperty({ description: 'Course subject', example: 'GS1' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Course price in paisa' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Course duration in days' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Course features', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ description: 'Course images', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Is course premium?' })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiProperty({ description: 'Is course active?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
