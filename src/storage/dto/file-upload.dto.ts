import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;

  @ApiProperty({
    description: 'Optional prefix/folder path',
    example: 'reports/user-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  prefix?: string;
}
