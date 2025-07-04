import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class EnrollmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  purchaseId: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  progressPercentage: number;

  @ApiProperty()
  completedLessons: number;

  @ApiProperty()
  totalLessons: number;

  @ApiProperty()
  lastAccessedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UpdateEnrollmentDto {
  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progressPercentage?: number;

  @ApiProperty({ description: 'Completed lessons count' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  completedLessons?: number;

  @ApiProperty({ description: 'Last accessed timestamp' })
  @IsDate()
  @IsOptional()
  lastAccessedAt?: Date;
}

export class EnrollmentStatsDto {
  @ApiProperty()
  totalEnrollments: number;

  @ApiProperty()
  activeEnrollments: number;

  @ApiProperty()
  completedCourses: number;

  @ApiProperty()
  averageProgress: number;
}
