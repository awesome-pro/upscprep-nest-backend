import {
  Body,
  Controller,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../services/payments.service';
import { Public } from '../../auth/decorators/public.decorator';
import { NotificationType, PurchaseStatus } from 'generated/prisma';
import { RazorpayWebhookEvent } from '../interfaces';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Handle Razorpay webhook events
   * This endpoint is public (no auth) as it's called by Razorpay
   */
  @Public()
  @Post('razorpay')
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: RazorpayWebhookEvent,
  ) {
    try {
      // Verify webhook signature
      const webhookSecret = this.configService.get<string>(
        'RAZORPAY_WEBHOOK_SECRET',
      );
      const signature = req.headers['x-razorpay-signature'] as string;

      if (
        !this.verifyWebhookSignature(
          req.rawBody as Buffer,
          signature,
          webhookSecret!,
        )
      ) {
        this.logger.warn('Invalid webhook signature');
        return { status: 'error', message: 'Invalid signature' };
      }

      this.logger.log(`Received webhook event: ${payload.event}`);

      // Handle different webhook events
      switch (payload.event) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'refund.created':
          await this.handleRefundCreated(payload);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${payload.event}`);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${error.message}`,
        error.stack,
      );
      return { status: 'error', message: 'Error processing webhook' };
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature),
      );
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle payment.authorized event
   */
  private async handlePaymentAuthorized(payload: RazorpayWebhookEvent) {
    try {
      const { payment, order } = payload.payload;
      if (!order) {
        this.logger.warn('Order information missing in webhook payload');
        return;
      }

      // Find purchase by Razorpay order ID
      const purchase = await this.prisma.purchase.findFirst({
        where: { razorpayOrderId: order.id },
      });

      if (!purchase) {
        this.logger.warn(`Purchase not found for order ID: ${order.id}`);
        return;
      }

      // If purchase is still pending, update it to completed
      if (purchase.status === PurchaseStatus.PENDING) {
        const updatedPurchase = await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            status: PurchaseStatus.COMPLETED,
            razorpayPaymentId: payment.id,
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
            testSeries: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        });

        // Process enrollments
        if (updatedPurchase.courseId) {
          await this.prisma.courseEnrollment.create({
            data: {
              userId: updatedPurchase.userId,
              courseId: updatedPurchase.courseId,
              purchaseId: updatedPurchase.id,
              startDate: updatedPurchase.validFrom,
              endDate: updatedPurchase.validTill,
              isActive: true,
            },
          });
        } else if (updatedPurchase.testSeriesId) {
          await this.prisma.testSeriesEnrollment.create({
            data: {
              userId: updatedPurchase.userId,
              testSeriesId: updatedPurchase.testSeriesId,
              purchaseId: updatedPurchase.id,
              startDate: updatedPurchase.validFrom,
              endDate: updatedPurchase.validTill,
              isActive: true,
            },
          });
        }

        // Create notification for user
        await this.prisma.notification.create({
          data: {
            userId: updatedPurchase.userId,
            title: 'Payment Successful',
            message: `Your payment for ${this.getItemTitle(updatedPurchase)} has been processed successfully.`,
            type: NotificationType.SYSTEM,
            metadata: {
              courseId: updatedPurchase.courseId,
              testSeriesId: updatedPurchase.testSeriesId,
            },
            isRead: false,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error handling payment.authorized: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle payment.failed event
   */
  private async handlePaymentFailed(payload: RazorpayWebhookEvent) {
    try {
      const { payment } = payload.payload;

      // Find purchase by Razorpay order ID
      const purchase = await this.prisma.purchase.findFirst({
        where: { razorpayOrderId: payment.order_id },
      });

      if (!purchase) {
        this.logger.warn(
          `Purchase not found for order ID: ${payment.order_id}`,
        );
        return;
      }

      // Update purchase status to failed
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: PurchaseStatus.FAILED,
          razorpayPaymentId: payment.id,
        },
      });

      // Create notification for user
      await this.prisma.notification.create({
        data: {
          userId: purchase.userId,
          title: 'Payment Failed',
          message:
            'Your payment could not be processed. Please try again or contact support.',
          type: NotificationType.SYSTEM,
          metadata: {
            courseId: purchase.courseId,
            testSeriesId: purchase.testSeriesId,
          },
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling payment.failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle refund.created event
   */
  private async handleRefundCreated(payload: RazorpayWebhookEvent) {
    try {
      const { payment } = payload.payload;

      // Find purchase by Razorpay payment ID
      const purchase = await this.prisma.purchase.findFirst({
        where: { razorpayPaymentId: payment.id },
      });

      if (!purchase) {
        this.logger.warn(`Purchase not found for payment ID: ${payment.id}`);
        return;
      }

      // Update purchase status to refunded
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: PurchaseStatus.REFUNDED,
        },
      });

      // Create notification for user
      await this.prisma.notification.create({
        data: {
          userId: purchase.userId,
          title: 'Refund Processed',
          message: 'Your refund has been processed successfully.',
          type: NotificationType.SYSTEM,
          metadata: {
            courseId: purchase.courseId,
            testSeriesId: purchase.testSeriesId,
          },
          isRead: false,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling refund.created: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get item title for notifications
   */
  private getItemTitle(purchase) {
    if (purchase.course) {
      return `Course: ${purchase.course.title}`;
    } else if (purchase.testSeries) {
      return `Test Series: ${purchase.testSeries.title}`;
    }
    return 'your purchase';
  }
}
