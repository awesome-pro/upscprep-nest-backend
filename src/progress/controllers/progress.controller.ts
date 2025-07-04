import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProgressService } from '../services/progress.service';
import { UpdateProgressDto } from '../dto/update-progress.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EntityType, User } from 'generated/prisma';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  async updateProgress(
    @CurrentUser() user: User,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(user.id, dto);
  }

  @Get('entity/:entityId/:entityType')
  async getProgress(
    @CurrentUser() user: User,
    @Param('entityId') entityId: string,
    @Param('entityType') entityType: EntityType,
  ) {
    return this.progressService.getProgress(user.id, entityId, entityType);
  }

  @Get('type/:entityType')
  async getAllProgressByType(
    @CurrentUser() user: User,
    @Param('entityType') entityType: EntityType,
  ) {
    return this.progressService.getAllProgressByType(user.id, entityType);
  }

  @Get('summary')
  async getProgressSummary(@CurrentUser() user: User) {
    return this.progressService.getProgressSummary(user.id);
  }
}
