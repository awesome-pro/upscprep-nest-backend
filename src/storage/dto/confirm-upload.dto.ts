import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'S3 object key',
    example: 'uploads/1624567890-file.pdf',
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'ETag from S3 upload response',
    example: '"d41d8cd98f00b204e9800998ecf8427e"',
    required: false,
  })
  @IsString()
  @IsOptional()
  etag?: string;
}
