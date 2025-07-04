import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationPreferencesService } from '../services/notification-preferences.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { NotificationType, NotificationChannel } from 'generated/prisma';
import {
  CreateNotificationPreferenceDto,
  UpdateNotificationPreferenceDto,
} from '../dto/notification-preference.dto.js';

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(
    private readonly notificationPreferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.notificationPreferencesService.findAll(user.id);
  }

  @Get('initialize')
  initializeDefaults(@CurrentUser() user: { id: string }) {
    return this.notificationPreferencesService.initializeDefaultPreferences(
      user.id,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationPreferencesService.findOne(user.id, id);
  }

  @Get('type/:type/channel/:channel')
  findByTypeAndChannel(
    @CurrentUser() user: { id: string },
    @Param('type') type: NotificationType,
    @Param('channel') channel: NotificationChannel,
  ) {
    return this.notificationPreferencesService.findByTypeAndChannel(
      user.id,
      type,
      channel,
    );
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createDto: CreateNotificationPreferenceDto,
  ) {
    return this.notificationPreferencesService.create(user.id, createDto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationPreferencesService.update(user.id, id, updateDto);
  }

  @Patch('type/:type/channel/:channel')
  updateByTypeAndChannel(
    @CurrentUser() user: { id: string },
    @Param('type') type: NotificationType,
    @Param('channel') channel: NotificationChannel,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationPreferencesService.updateByTypeAndChannel(
      user.id,
      type,
      channel,
      updateDto,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.notificationPreferencesService.remove(user.id, id);
  }
}
