import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { RazorpayOrderOptions } from '../interfaces';
import { Orders } from 'razorpay/dist/types/orders';
import { Payments } from 'razorpay/dist/types/payments';
import { Refunds } from 'razorpay/dist/types/refunds';

@Injectable()
export class RazorpayService {
  private readonly razorpay: Razorpay;
  private readonly logger = new Logger(RazorpayService.name);

  constructor(private readonly configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID')!,
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET')!,
    });
  }

  /**
   * Create a new Razorpay order
   * @param options Order options
   * @returns Promise with order details
   */
  async createOrder(
    options: RazorpayOrderOptions,
  ): Promise<Orders.RazorpayOrder> {
    try {
      return await this.razorpay.orders.create(options);
    } catch (error) {
      this.logger.error(
        `Error creating Razorpay order: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Verify Razorpay payment signature
   * @param orderId Razorpay order ID
   * @param paymentId Razorpay payment ID
   * @param signature Razorpay signature
   * @returns Boolean indicating if signature is valid
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    try {
      const generatedSignature = crypto
        .createHmac(
          'sha256',
          this.configService.get<string>('RAZORPAY_KEY_SECRET')!,
        )
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      this.logger.error(
        `Error verifying payment signature: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Fetch payment details by payment ID
   * @param paymentId Razorpay payment ID
   * @returns Payment details
   */
  async fetchPaymentById(paymentId: string): Promise<Payments.RazorpayPayment> {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      this.logger.error(
        `Error fetching payment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Fetch order details by order ID
   * @param orderId Razorpay order ID
   * @returns Order details
   */
  async fetchOrderById(orderId: string): Promise<Orders.RazorpayOrder> {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error) {
      this.logger.error(`Error fetching order: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Refund a payment
   * @param paymentId Razorpay payment ID
   * @param amount Amount to refund (in paise)
   * @returns Refund details
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<Refunds.RazorpayRefund> {
    try {
      const refundOptions = amount ? { amount } : {};
      return await this.razorpay.payments.refund(paymentId, refundOptions);
    } catch (error) {
      this.logger.error(
        `Error processing refund: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
