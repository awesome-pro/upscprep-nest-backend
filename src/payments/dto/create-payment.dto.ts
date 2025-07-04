import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PurchaseType } from 'generated/prisma';

export class CreatePaymentDto {
  @IsEnum(PurchaseType)
  @IsNotEmpty()
  type: PurchaseType;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  testSeriesId?: string;

  @IsOptional()
  @IsUUID()
  examId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
