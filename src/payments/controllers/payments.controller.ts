import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto, VerifyPaymentDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create a new payment order
   * @param user Current user from JWT
   * @param createPaymentDto Payment details
   * @returns Order details for frontend
   */
  @Post('create-order')
  async createOrder(
    @CurrentUser() user: User,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentOrder(user.id, createPaymentDto);
  }

  /**
   * Verify payment after user completes payment on frontend
   * @param user Current user from JWT
   * @param verifyPaymentDto Payment verification details
   * @returns Updated purchase record
   */
  @Post('verify')
  async verifyPayment(
    @CurrentUser() user: User,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.id, verifyPaymentDto);
  }

  /**
   * Get user purchases
   * @param user Current user from JWT
   * @returns List of purchases
   */
  @Get('purchases')
  async getUserPurchases(@CurrentUser() user: User) {
    return this.paymentsService.getUserPurchases(user.id);
  }

  /**
   * Get purchase by ID
   * @param user Current user from JWT
   * @param id Purchase ID
   * @returns Purchase details
   */
  @Get('purchases/:id')
  async getPurchaseById(@CurrentUser() user: User, @Param('id') id: string) {
    const purchase = await this.paymentsService.getPurchaseById(id);

    // Ensure user owns this purchase
    if (purchase.userId !== user.id) {
      throw new Error('Unauthorized access to purchase');
    }

    return purchase;
  }
}
