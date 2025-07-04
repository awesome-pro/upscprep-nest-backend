import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(
    @CurrentUser() user: { id: string },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      page,
      limit,
      unreadOnly,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post(':id/read')
  markAsRead(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  deleteNotification(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.deleteNotification(user.id, id);
  }
}
