import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FileExistsDto {
  @ApiProperty({
    description: 'S3 object key to check existence',
    example: '1624561234-report.pdf',
  })
  @IsNotEmpty()
  @IsString()
  key: string;
}
