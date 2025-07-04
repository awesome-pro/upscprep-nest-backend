import { IsInt, IsOptional } from 'class-validator';

export class UpdateStreakDto {
  @IsOptional()
  @IsInt()
  studyMinutes?: number;

  @IsOptional()
  @IsInt()
  testsAttempted?: number;

  @IsOptional()
  @IsInt()
  lessonsCompleted?: number;

  @IsOptional()
  @IsInt()
  questionsAnswered?: number;

  @IsOptional()
  @IsInt()
  pointsEarned?: number;
}
