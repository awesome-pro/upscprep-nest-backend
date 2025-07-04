import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @IsEnum(UserRole, {
    message: 'Role must be either TEACHER, STUDENT, or ADMIN',
  })
  role?: UserRole;
}
