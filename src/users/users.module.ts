import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentController } from './controllers/student.controller';
import { StudentService } from './services/student.service';
import { TeacherController } from './controllers/teacher.controller';
import { TeacherService } from './services/teacher.service';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminUserService } from './services/admin-user.service';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { CourseService } from '../courses/services/course.service';
import { TestSeriesService } from '../exams/services';

@Module({
  imports: [PrismaModule],
  controllers: [
    StudentController,
    TeacherController,
    AdminUserController,
    AdminDashboardController,
    ProfileController,
  ],
  providers: [
    StudentService,
    TeacherService,
    AdminUserService,
    AdminDashboardService,
    ProfileService,
    CourseService,
    TestSeriesService,
  ],
  exports: [StudentService, TeacherService, AdminUserService, ProfileService],
})
export class UsersModule {}
