import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { RazorpayService } from './services/razorpay.service';
import { WebhookController } from './controllers/webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CourseEnrollmentService } from './services/course-enrollment.service';
import { TestSeriesEnrollmentService } from './services/test-series-enrollment.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, WebhookController],
  providers: [
    PaymentsService, 
    RazorpayService, 
    CourseEnrollmentService, 
    TestSeriesEnrollmentService
  ],
  exports: [PaymentsService, RazorpayService],
})
export class PaymentsModule {}
