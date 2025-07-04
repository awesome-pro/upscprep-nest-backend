import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import {
  NotificationType,
  Purchase,
  PurchaseStatus,
  PurchaseType,
} from 'generated/prisma';
import { CourseEnrollmentService } from './course-enrollment.service';
import { TestSeriesEnrollmentService } from './test-series-enrollment.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
    private readonly courseEnrollmentService: CourseEnrollmentService,
    private readonly testSeriesEnrollmentService: TestSeriesEnrollmentService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new payment order
   * @param userId User ID
   * @param createPaymentDto Payment details
   * @returns Order details for frontend
   */
  async createPaymentOrder(userId: string, createPaymentDto: CreatePaymentDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate purchase type and get amount
      const { amount, itemDetails } =
        await this.calculateAmount(createPaymentDto);

      // Create purchase record in pending state
      const purchase = await this.prisma.purchase.create({
        data: {
          userId,
          type: createPaymentDto.type,
          courseId: createPaymentDto.courseId,
          testSeriesId: createPaymentDto.testSeriesId,
          examId: createPaymentDto.examId,
          amount,
          finalAmount: amount,
          status: PurchaseStatus.PENDING,
          validFrom: new Date(),
          validTill: this.calculateValidTill(new Date()),
          metadata: createPaymentDto.notes
            ? { notes: createPaymentDto.notes }
            : {},
        },
      });

      // Create Razorpay order
      const order = await this.razorpayService.createOrder({
        amount: purchase.finalAmount,
        currency: 'INR',
        receipt: purchase.id,
        notes: {
          purchaseId: purchase.id,
          userId,
          type: createPaymentDto.type,
          ...(createPaymentDto.notes && { notes: createPaymentDto.notes }),
        },
      });

      // Update purchase with order ID
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { razorpayOrderId: order.id },
      });

      // Return order details for frontend
      return {
        id: purchase.id,
        purchaseId: purchase.id,
        orderId: order.id,
        amount:
          typeof order.amount === 'string'
            ? parseFloat(order.amount) / 100
            : order.amount / 100, // Convert to rupees for display
        currency: order.currency,
        keyId: this.configService.get<string>('RAZORPAY_KEY_ID')!,
        name: 'UPSC Preparation App',
        description: `Purchase of ${itemDetails.title}`,
        prefillEmail: user.email,
        prefillName: user.name,
      };
    } catch (error) {
      this.logger.error(
        `Error creating payment order: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify payment after user completes payment on frontend
   * @param userId User ID
   * @param verifyPaymentDto Payment verification details
   * @returns Updated purchase record
   */
  async verifyPayment(userId: string, verifyPaymentDto: VerifyPaymentDto) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        verifyPaymentDto;

      // Verify signature
      const isValidSignature = this.razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );

      if (!isValidSignature) {
        throw new BadRequestException('Invalid payment signature');
      }

      // Find purchase by Razorpay order ID
      const purchase = await this.prisma.purchase.findFirst({
        where: { razorpayOrderId },
      });

      if (!purchase) {
        throw new NotFoundException('Purchase not found');
      }

      if (purchase.userId !== userId) {
        throw new BadRequestException('User does not own this purchase');
      }

      // Update purchase status
      const updatedPurchase = await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: PurchaseStatus.COMPLETED,
          razorpayPaymentId,
          razorpaySignature,
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

      // Process enrollments based on purchase type
      await this.processEnrollments(updatedPurchase);

      return updatedPurchase;
    } catch (error) {
      this.logger.error(
        `Error verifying payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process enrollments after successful payment
   * @param purchase Completed purchase
   */
  private async processEnrollments(purchase: Purchase) {
    try {
      if (purchase.status !== PurchaseStatus.COMPLETED) {
        return;
      }

      if (purchase.type === PurchaseType.COURSE && purchase.courseId) {
        await this.courseEnrollmentService.processCourseEnrollment(purchase);
      } else if (
        purchase.type === PurchaseType.TEST_SERIES &&
        purchase.testSeriesId
      ) {
        await this.testSeriesEnrollmentService.processTestSeriesEnrollment(
          purchase,
        );
      }

      // Create notification for user
      await this.prisma.notification.create({
        data: {
          userId: purchase.userId,
          title: 'Purchase Successful',
          message: `Your purchase of ${this.getPurchaseDescription(purchase)} has been completed successfully.`,
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
        `Error processing enrollments: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get purchase description for notifications
   */
  private getPurchaseDescription(purchase) {
    if (purchase.type === PurchaseType.COURSE && purchase.course) {
      return `Course: ${purchase.course.title}`;
    } else if (
      purchase.type === PurchaseType.TEST_SERIES &&
      purchase.testSeries
    ) {
      return `Test Series: ${purchase.testSeries.title}`;
    }
    return 'Product';
  }

  /**
   * Calculate amount based on purchase type and item
   * @param createPaymentDto Payment details
   * @returns Amount in paise and item details
   */
  private async calculateAmount(createPaymentDto: CreatePaymentDto) {
    try {
      const { type, courseId, testSeriesId, examId } = createPaymentDto;

      if (type === PurchaseType.COURSE && courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
          select: { id: true, title: true, price: true, type: true },
        });

        if (!course) {
          throw new NotFoundException('Course not found');
        }

        return {
          amount: course.price,
          itemDetails: {
            id: course.id,
            title: course.title,
            type: course.type,
          },
        };
      } else if (type === PurchaseType.TEST_SERIES && testSeriesId) {
        const testSeries = await this.prisma.testSeries.findUnique({
          where: { id: testSeriesId },
          select: { id: true, title: true, price: true, type: true },
        });

        if (!testSeries) {
          throw new NotFoundException('Test series not found');
        }

        return {
          amount: testSeries.price,
          itemDetails: {
            id: testSeries.id,
            title: testSeries.title,
            type: testSeries.type,
          },
        };
      } else {
        throw new BadRequestException(
          'Invalid purchase type or missing required ID',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error calculating amount: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate valid till date (1 year from purchase)
   * @param startDate Start date
   * @returns End date
   */
  private calculateValidTill(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate;
  }

  /**
   * Get user purchases
   * @param userId User ID
   * @returns List of purchases
   */
  async getUserPurchases(userId: string) {
    return this.prisma.purchase.findMany({
      where: {
        userId,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get purchase by ID
   * @param purchaseId Purchase ID
   * @returns Purchase details
   */
  async getPurchaseById(purchaseId: string) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
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

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }
}
