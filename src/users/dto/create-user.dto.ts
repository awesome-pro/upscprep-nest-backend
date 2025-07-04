import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../../../generated/prisma';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEnum(UserRole, {
    message: 'Role must be either TEACHER, STUDENT, or ADMIN',
  })
  role: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  dateOfBirth?: Date;
}
