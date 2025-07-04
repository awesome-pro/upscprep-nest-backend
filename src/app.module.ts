import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TodosModule } from './todos/todos.module';
import jwtConfig from './config/jwt.config';
import { ExamsModule } from './exams/exams.module';
import { PaymentsModule } from './payments/payments.module';
import { CoursesModule } from './courses/courses.module';
import { TestSeriesModule } from './test-series/test-series.module';
import { StorageModule } from './storage/storage.module';
import { ProgressModule } from './progress/progress.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    AuthModule,
    TodosModule,
    ExamsModule,
    PaymentsModule,
    CoursesModule,
    TestSeriesModule,
    StorageModule,
    ProgressModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
