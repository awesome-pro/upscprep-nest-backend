import {
  Course,
  PurchaseStatus,
  PurchaseType,
  TestSeries,
} from 'generated/prisma';

export class PaymentResponseDto {
  id: string;
  userId: string;
  type: PurchaseType;
  amount: number;
  finalAmount: number;
  status: PurchaseStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string;

  validFrom: Date;
  validTill: Date;
  createdAt: Date;
  updatedAt: Date;

  // Related entity details
  courseDetails?: Course;

  testSeriesDetails?: TestSeries;
}
