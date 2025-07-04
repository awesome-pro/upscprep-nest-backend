import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsController } from './controllers/notifications.controller.js';
import { NotificationPreferencesController } from './controllers/notification-preferences.controller.js';
import { NotificationPreferencesService } from './services/notification-preferences.service.js';
import { NotificationsService } from './services/notifications.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationPreferencesService, NotificationsService],
  exports: [NotificationPreferencesService, NotificationsService],
})
export class NotificationsModule {}