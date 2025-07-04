import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  ExamService,
  TestSeriesService,
  AttemptService,
  AnswerKeyService,
  QuestionService,
  AnswerService,
} from './services';
import {
  ExamController,
  TestSeriesController,
  AttemptController,
  AnswerKeyController,
  QuestionController,
  AnswerController,
} from './controllers';

@Module({
  imports: [PrismaModule],
  controllers: [
    ExamController,
    TestSeriesController,
    AttemptController,
    AnswerKeyController,
    QuestionController,
    AnswerController,
  ],
  providers: [
    ExamService,
    TestSeriesService,
    AttemptService,
    AnswerKeyService,
    QuestionService,
    AnswerService,
  ],
  exports: [
    ExamService,
    TestSeriesService,
    AttemptService,
    AnswerKeyService,
    QuestionService,
    AnswerService,
  ],
})
export class ExamsModule {}
