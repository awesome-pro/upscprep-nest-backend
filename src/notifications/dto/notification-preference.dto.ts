import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationChannel, NotificationType } from 'generated/prisma';

export class CreateNotificationPreferenceDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateNotificationPreferenceDto {
  @IsBoolean()
  @IsNotEmpty()
  enabled!: boolean;
}

export class NotificationPreferenceResponseDto {
  @IsString()
  id!: string;

  @IsString()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsBoolean()
  enabled!: boolean;

  @IsString()
  createdAt!: Date;

  @IsString()
  updatedAt!: Date;
}
