import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class TestSeriesEnrollmentResponseDto {
  @ApiProperty({ description: 'Enrollment ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Test Series ID' })
  testSeriesId: string;

  @ApiProperty({ description: 'Purchase ID' })
  purchaseId: string;

  @ApiProperty({ description: 'Start date of enrollment' })
  startDate: Date;

  @ApiProperty({ description: 'End date of enrollment' })
  endDate: Date;

  @ApiProperty({ description: 'Whether the enrollment is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of tests attempted' })
  testsAttempted: number;

  @ApiProperty({ description: 'Total number of tests in the series' })
  totalTests: number;

  @ApiProperty({
    description: 'Average score across all attempted tests',
    nullable: true,
  })
  averageScore: number | null;

  @ApiProperty({ description: 'Creation date of enrollment' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of enrollment' })
  updatedAt: Date;
}

export class UpdateTestSeriesEnrollmentDto {
  @ApiProperty({ description: 'Tests attempted count' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  testsAttempted?: number;

  @ApiProperty({ description: 'Average score across all tests' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  averageScore?: number;
}

export class TestSeriesEnrollmentStatsDto {
  @ApiProperty()
  totalEnrollments: number;

  @ApiProperty()
  activeEnrollments: number;

  @ApiProperty()
  completedTests: number;

  @ApiProperty()
  averageScore: number;
}
