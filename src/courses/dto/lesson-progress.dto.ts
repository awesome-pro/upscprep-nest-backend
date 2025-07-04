import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export class UpdateLessonProgressDto {
  @ApiProperty({ description: 'Is lesson completed?' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({ description: 'Time spent on lesson in seconds' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  timeSpent?: number;

  @ApiProperty({ description: 'Last position in video (seconds)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  lastPosition?: number;

  @ApiProperty({ description: 'Quiz score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  quizScore?: number;

  @ApiProperty({ description: 'Quiz attempts count' })
  @IsInt()
  @Min(0)
  @IsOptional()
  quizAttempts?: number;

  @ApiProperty({ description: 'Quiz passed status' })
  @IsBoolean()
  @IsOptional()
  quizPassed?: boolean;
}

export class LessonProgressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  isCompleted: boolean;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty()
  timeSpent: number;

  @ApiProperty()
  lastPosition: number;

  @ApiProperty({ nullable: true })
  quizScore: number | null;

  @ApiProperty()
  quizAttempts: number;

  @ApiProperty()
  quizPassed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
