import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessType, AttemptStatus } from 'generated/prisma';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  IsObject,
  IsNumber,
} from 'class-validator';

export class CreateAttemptDto {
  @ApiProperty({ description: 'Exam ID for this attempt' })
  @IsUUID()
  @IsNotEmpty()
  examId: string;

  @ApiPropertyOptional({
    description: 'Access type for this attempt',
    enum: AccessType,
    default: AccessType.TEST_SERIES,
  })
  @IsEnum(AccessType)
  @IsOptional()
  accessType?: AccessType;

  @ApiPropertyOptional({
    description: 'Enrollment ID (CourseEnrollment or TestSeriesEnrollment ID)',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.accessType !== AccessType.INDIVIDUAL)
  enrollmentId?: string;

  @ApiPropertyOptional({
    description: 'Status of the attempt',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  @IsEnum(AttemptStatus)
  @IsOptional()
  status?: AttemptStatus;

  @ApiPropertyOptional({
    description: 'JSON data containing time spent on each question/section',
    example: { '1': 120, '2': 85, '3': 150 },
  })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}
