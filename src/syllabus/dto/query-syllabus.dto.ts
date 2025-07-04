import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuerySyllabusDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 10)
  pageSize?: number = 10;
}
