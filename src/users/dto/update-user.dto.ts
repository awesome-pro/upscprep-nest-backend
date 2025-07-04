import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { UserRole, UserStatus } from '../../../generated/prisma';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsPhoneNumber('IN', { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  dateOfBirth?: Date;
}
