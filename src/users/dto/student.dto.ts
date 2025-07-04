import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../../generated/prisma';

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  dateOfBirth?: Date;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class StudentEnrollmentQueryDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  testSeriesId?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 10;
}
