import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EntityType } from 'generated/prisma';

export class UpdateProgressDto {
  @IsString()
  entityId: string;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsInt()
  timeSpent?: number;

  @IsOptional()
  @IsInt()
  lastPosition?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
