import { Module } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { TestSeriesController } from './test-series.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TestSeriesController],
  providers: [TestSeriesService],
  exports: [TestSeriesService],
})
export class TestSeriesModule {}
