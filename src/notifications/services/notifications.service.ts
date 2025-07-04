import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  Notification,
  NotificationChannel,
  NotificationType,
} from 'generated/prisma';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from 'src/util/pagination';

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  actionData?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(userId: string, notificationData: NotificationData) {
    // Create the notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        isRead: false,
        actionUrl: notificationData.actionUrl,
        actionData: notificationData.actionData,
      },
    });

    // Check user preferences for this notification type
    await this.sendNotificationBasedOnPreferences(
      userId,
      notification.id,
      notificationData,
    );

    return notification;
  }

  private async sendNotificationBasedOnPreferences(
    userId: string,
    notificationId: string,
    notificationData: NotificationData,
  ) {
    try {
      // Get all preferences for this user and notification type
      const preferences = await this.prisma.notificationPreference.findMany({
        where: {
          userId,
          type: notificationData.type,
          enabled: true,
        },
      });

      // Send notifications based on enabled channels
      for (const preference of preferences) {
        switch (preference.channel) {
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(userId, notificationData);
            break;
          case NotificationChannel.PUSH:
            await this.sendPushNotification(userId, notificationData);
            break;
          case NotificationChannel.IN_APP:
            // In-app notifications are already stored in the database
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't throw the error - we don't want to fail the main operation
      // if notification delivery fails
    }
  }

  private async sendEmailNotification(
    userId: string,
    notificationData: NotificationData,
  ) {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      return;
    }

    // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
    console.log(
      `[EMAIL NOTIFICATION] To: ${user.email}, Subject: ${notificationData.title}, Message: ${notificationData.message}`,
    );

    // Example implementation with a real email service would go here
    // await this.emailService.sendEmail({
    //   to: user.email,
    //   subject: notificationData.title,
    //   text: notificationData.message,
    //   html: `<h1>${notificationData.title}</h1><p>${notificationData.message}</p>`,
    // });
  }

  private async sendPushNotification(
    userId: string,
    notificationData: NotificationData,
  ) {
    // In a real application, you would integrate with a push notification service
    // like Firebase Cloud Messaging, OneSignal, etc.
    console.log(
      `[PUSH NOTIFICATION] UserId: ${userId}, Title: ${notificationData.title}, Message: ${notificationData.message}`,
    );

    // Example implementation with a real push notification service would go here
    // await this.pushService.sendPushNotification({
    //   userId,
    //   title: notificationData.title,
    //   body: notificationData.message,
    //   data: notificationData.data,
    // });
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 10,
    unreadOnly = false,
  ): Promise<PaginatedResponse<Notification>> {
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return createPaginatedResponse(notifications, total, limit, page);
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }
}
