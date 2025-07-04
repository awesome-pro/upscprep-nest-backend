import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: "User's full name" })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiProperty({ description: "User's email address" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "User's phone number" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: "User's date of birth", example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
