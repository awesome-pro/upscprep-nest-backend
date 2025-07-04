import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Lesson description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Lesson order in module' })
  @IsInt()
  @IsPositive()
  order: number;

  @ApiProperty({ description: 'Text content for TEXT type lessons' })
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiProperty({
    description: 'Video URLs for VIDEO type lessons',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videoUrls?: string[];

  @ApiProperty({ description: 'Video duration in seconds' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  videoDuration?: number;

  @ApiProperty({
    description: 'File URLs for PDF or ASSIGNMENT type lessons',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];

  @ApiProperty({ description: 'Quiz data for QUIZ type lessons' })
  @IsObject()
  @IsOptional()
  quizData?: Record<string, any>;

  @ApiProperty({ description: 'Is lesson preview?', default: false })
  @IsBoolean()
  @IsOptional()
  isPreview?: boolean;

  @ApiProperty({ description: 'Is lesson mandatory?', default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class UpdateLessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Lesson description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Lesson order in module' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Text content for TEXT type lessons' })
  @IsString()
  @IsOptional()
  textContent?: string;

  @ApiProperty({
    description: 'Video URLs for VIDEO type lessons',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videoUrls?: string[];

  @ApiProperty({ description: 'Video duration in seconds' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  videoDuration?: number;

  @ApiProperty({
    description: 'File URLs for PDF or ASSIGNMENT type lessons',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];

  @ApiProperty({ description: 'Quiz data for QUIZ type lessons' })
  @IsObject()
  @IsOptional()
  quizData?: Record<string, any>;

  @ApiProperty({ description: 'Is lesson preview?' })
  @IsBoolean()
  @IsOptional()
  isPreview?: boolean;

  @ApiProperty({ description: 'Is lesson mandatory?' })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class LessonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  order: number;

  @ApiProperty({ nullable: true })
  textContent?: string | null;

  @ApiProperty({ type: [String] })
  videoUrls: string[];

  @ApiProperty({ nullable: true })
  videoDuration?: number | null;

  @ApiProperty({ type: [String] })
  fileUrls: string[];

  @ApiProperty({ nullable: true })
  quizData?: Record<string, any> | null;

  @ApiProperty()
  isPreview: boolean;

  @ApiProperty()
  isMandatory: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export enum LessonOrderBy {
  TITLE = 'title',
  ORDER = 'order',
  CONTENT_TYPE = 'contentType',
  CREATED_AT = 'createdAt',
}

enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class LessonQueryParamsDto {
  @ApiProperty({
    required: false,
    description: 'Page number (1-indexed)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  pageSize?: number;

  @ApiProperty({
    required: false,
    description: 'Search term for title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by preview status',
  })
  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @ApiProperty({
    required: false,
    description: 'Filter by mandatory status',
  })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({
    required: false,
    enum: LessonOrderBy,
    description: 'Field to order by',
  })
  @IsOptional()
  @IsEnum(LessonOrderBy)
  orderBy?: LessonOrderBy;

  @ApiProperty({
    required: false,
    enum: OrderDirection,
    description: 'Order direction',
  })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection;
}
