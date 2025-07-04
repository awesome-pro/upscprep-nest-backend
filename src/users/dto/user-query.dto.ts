import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from 'generated/prisma';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  pageSize?: number = 10;
}
