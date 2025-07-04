import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  completed?: boolean;

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
