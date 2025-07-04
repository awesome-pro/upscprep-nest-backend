import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressService } from './services/progress.service';
import { StreakService } from './services/streak.service';
import { ProgressController } from './controllers/progress.controller';
import { StreakController } from './controllers/streak.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController, StreakController],
  providers: [ProgressService, StreakService],
  exports: [ProgressService, StreakService],
})
export class ProgressModule {}
