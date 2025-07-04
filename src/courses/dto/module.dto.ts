import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Module description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Module order in course' })
  @IsInt()
  @IsPositive()
  order: number;

  @ApiProperty({ description: 'Is module active?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Module image' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

export class UpdateModuleDto {
  @ApiProperty({ description: 'Module title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Module description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Module order in course' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Is module active?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of lessons in this module',
    required: false,
  })
  lessonCount?: number;
}

export enum ModuleOrderBy {
  TITLE = 'title',
  ORDER = 'order',
  CREATED_AT = 'createdAt',
}

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class ModuleQueryParamsDto {
  @ApiProperty({ required: false, description: 'Page number (1-indexed)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiProperty({ required: false, description: 'Number of items per page' })
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

  @ApiProperty({ required: false, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    enum: ModuleOrderBy,
    description: 'Field to order by',
  })
  @IsOptional()
  @IsEnum(ModuleOrderBy)
  orderBy?: ModuleOrderBy;

  @ApiProperty({
    required: false,
    enum: OrderDirection,
    description: 'Order direction',
  })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection;
}
