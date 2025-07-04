import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StreakService } from '../services/streak.service';
import { UpdateStreakDto } from '../dto/update-streak.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma';

@Controller('streak')
@UseGuards(JwtAuthGuard)
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Post()
  async updateStreak(@CurrentUser() user: User, @Body() dto: UpdateStreakDto) {
    return this.streakService.updateStreak(user.id, dto);
  }

  @Get()
  async getStreak(@CurrentUser() user: User) {
    return this.streakService.getStreak(user.id);
  }
}
