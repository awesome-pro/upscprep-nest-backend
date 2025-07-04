import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Purchase } from '../../../generated/prisma';

@Injectable()
export class TestSeriesEnrollmentService {
  private readonly logger = new Logger(TestSeriesEnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process test series enrollment after successful payment
   * @param purchase The completed purchase record
   * @returns The created enrollment
   */
  async processTestSeriesEnrollment(purchase: Purchase) {
    try {
      if (!purchase.testSeriesId) {
        throw new NotFoundException('Test Series ID not found in purchase');
      }

      // Get test series details
      const testSeries = await this.prisma.testSeries.findUnique({
        where: { id: purchase.testSeriesId },
        include: {
          exams: true,
        },
      });

      if (!testSeries) {
        throw new NotFoundException(
          `Test Series with ID ${purchase.testSeriesId} not found`,
        );
      }

      // Create test series enrollment
      const enrollment = await this.prisma.testSeriesEnrollment.create({
        data: {
          userId: purchase.userId,
          testSeriesId: purchase.testSeriesId,
          purchaseId: purchase.id,
          startDate: purchase.validFrom,
          endDate: purchase.validTill,
          totalTests: testSeries.totalTests || testSeries.exams.length,
          isActive: true,
        },
      });

      return enrollment;
    } catch (error) {
      this.logger.error(
        `Error processing test series enrollment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all test series enrollments for a user
   * @param userId User ID
   * @returns List of enrollments with test series details
   */
  async getUserEnrollments(userId: string) {
    return this.prisma.testSeriesEnrollment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        testSeries: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            totalTests: true,
          },
        },
      },
    });
  }

  /**
   * Check if a user is enrolled in a specific test series
   * @param userId User ID
   * @param testSeriesId Test Series ID
   * @returns Boolean indicating if user is enrolled
   */
  async isUserEnrolled(userId: string, testSeriesId: string): Promise<boolean> {
    const enrollment = await this.prisma.testSeriesEnrollment.findFirst({
      where: {
        userId,
        testSeriesId,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    return !!enrollment;
  }
}
