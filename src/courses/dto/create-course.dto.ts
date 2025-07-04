import { ApiProperty } from '@nestjs/swagger';
import { CourseType } from 'generated/prisma';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Course description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Course type', enum: CourseType })
  @IsEnum(CourseType)
  type: CourseType;

  @ApiProperty({ description: 'Course subject', example: 'GS1' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Course price in paisa' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'Course duration in days', default: 365 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Course features', type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Course Images', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Is course premium?', default: true })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiProperty({ description: 'Is course active?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
