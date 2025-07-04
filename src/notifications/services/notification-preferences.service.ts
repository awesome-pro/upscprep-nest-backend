import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  NotificationChannel,
  NotificationPreference,
  NotificationType,
} from 'generated/prisma';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from '../dto/notification-preference.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<NotificationPreference[]> {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { channel: 'asc' }],
    });
  }

  async findOne(userId: string, id: string): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!preference) {
      throw new NotFoundException(
        `Notification preference with ID ${id} not found`,
      );
    }

    return preference;
  }

  async findByTypeAndChannel(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<NotificationPreference> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_type_channel: {
          userId,
          type,
          channel,
        },
      },
    });

    if (!preference) {
      throw new NotFoundException(
        `Notification preference for type ${type} and channel ${channel} not found`,
      );
    }

    return preference;
  }

  async create(userId: string, createDto: CreateNotificationPreferenceDto) {
    // Check if the preference already exists
    const existingPreference =
      await this.prisma.notificationPreference.findUnique({
        where: {
          userId_type_channel: {
            userId,
            type: createDto.type,
            channel: createDto.channel,
          },
        },
      });

    if (existingPreference) {
      // If it exists, update it
      return this.prisma.notificationPreference.update({
        where: { id: existingPreference.id },
        data: { enabled: createDto.enabled ?? true },
      });
    }

    // If it doesn't exist, create it
    return this.prisma.notificationPreference.create({
      data: {
        userId,
        type: createDto.type,
        channel: createDto.channel,
        enabled: createDto.enabled ?? true,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateNotificationPreferenceDto,
  ) {
    // Ensure the preference exists and belongs to the user
    const preference = await this.findOne(userId, id);

    return this.prisma.notificationPreference.update({
      where: { id },
      data: { enabled: updateDto.enabled },
    });
  }

  async updateByTypeAndChannel(
    userId: string,
    type: NotificationType,
    channel: NotificationChannel,
    updateDto: UpdateNotificationPreferenceDto,
  ) {
    // Ensure the preference exists
    await this.findByTypeAndChannel(userId, type, channel);

    return this.prisma.notificationPreference.update({
      where: {
        userId_type_channel: {
          userId,
          type,
          channel,
        },
      },
      data: { enabled: updateDto.enabled },
    });
  }

  async remove(userId: string, id: string) {
    // Ensure the preference exists and belongs to the user
    await this.findOne(userId, id);

    await this.prisma.notificationPreference.delete({
      where: { id },
    });

    return { success: true };
  }

  async initializeDefaultPreferences(userId: string) {
    const notificationTypes = Object.values(NotificationType);
    const notificationChannels = Object.values(NotificationChannel);

    const defaultPreferences: NotificationPreference[] = [];

    for (const type of notificationTypes) {
      for (const channel of notificationChannels) {
        const enabled = channel !== NotificationChannel.PUSH;

        defaultPreferences.push({
          id: Math.random().toString(),
          userId,
          type,
          channel,
          enabled,
        });
      }
    }

    await this.prisma.notificationPreference.createMany({
      data: defaultPreferences,
      skipDuplicates: true,
    });

    return this.findAll(userId);
  }
}
