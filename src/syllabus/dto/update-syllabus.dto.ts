import { IsOptional, IsString } from 'class-validator';

export class UpdateSyllabusDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
