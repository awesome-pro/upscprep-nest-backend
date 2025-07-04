import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import {
  EnrollmentController,
  LessonController,
  ModuleController,
  TestSeriesEnrollmentController,
} from './controllers';
import {
  CourseService,
  EnrollmentService,
  LessonService,
  ModuleService,
  TestSeriesEnrollmentService,
} from './services';

@Module({
  imports: [PrismaModule],
  controllers: [
    CoursesController,
    LessonController,
    ModuleController,
    EnrollmentController,
    TestSeriesEnrollmentController,
  ],
  providers: [
    EnrollmentService,
    ModuleService,
    LessonService,
    CourseService,
    TestSeriesEnrollmentService,
  ],
})
export class CoursesModule {}
