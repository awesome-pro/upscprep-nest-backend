import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';

export class PresignedUrlDto {
  @ApiProperty({
    description: 'Original file name to generate a unique key',
    example: 'report.pdf',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Content type of the file',
    example: 'application/pdf',
  })
  @IsNotEmpty()
  @IsString()
  contentType: string;

  @ApiProperty({
    description: 'Optional prefix/folder path',
    example: 'reports/user-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
    required: false,
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  expiresIn?: number;
}
