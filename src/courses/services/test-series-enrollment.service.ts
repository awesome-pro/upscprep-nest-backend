import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TestSeriesEnrollmentResponseDto,
  TestSeriesEnrollmentStatsDto,
  UpdateTestSeriesEnrollmentDto,
} from '../dto/test-series-enrollment.dto';

@Injectable()
export class TestSeriesEnrollmentService {
  constructor(private prisma: PrismaService) {}

  async createEnrollment(
    userId: string,
    testSeriesId: string,
    purchaseId: string,
    endDate: Date,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    // Get the test series to set the total tests count
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id: testSeriesId },
      select: { totalTests: true },
    });

    if (!testSeries) {
      throw new NotFoundException(
        `Test Series with ID ${testSeriesId} not found`,
      );
    }

    return this.prisma.testSeriesEnrollment.create({
      data: {
        userId,
        testSeriesId,
        isActive: true,
        purchaseId,
        endDate,
        totalTests: testSeries.totalTests,
      },
    });
  }

  async findUserEnrollments(
    userId: string,
  ): Promise<TestSeriesEnrollmentResponseDto[]> {
    return this.prisma.testSeriesEnrollment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        testSeries: {
          select: {
            title: true,
            description: true,
            type: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findTestSeriesEnrollments(
    testSeriesId: string,
  ): Promise<TestSeriesEnrollmentResponseDto[]> {
    return this.prisma.testSeriesEnrollment.findMany({
      where: {
        testSeriesId,
        isActive: true,
      },
      include: {
        testSeries: {
          select: {
            title: true,
            description: true,
            type: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<TestSeriesEnrollmentResponseDto> {
    const enrollment = await this.prisma.testSeriesEnrollment.findUnique({
      where: { id },
      include: {
        testSeries: {
          select: {
            title: true,
            description: true,
            type: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Test Series Enrollment with ID ${id} not found`,
      );
    }

    return enrollment;
  }

  async findUserTestSeriesEnrollment(
    userId: string,
    testSeriesId: string,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    const enrollment = await this.prisma.testSeriesEnrollment.findFirst({
      where: {
        userId,
        testSeriesId,
        isActive: true,
      },
      include: {
        testSeries: {
          select: {
            title: true,
            description: true,
            type: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment for user ${userId} and test series ${testSeriesId} not found`,
      );
    }

    return enrollment;
  }

  async update(
    id: string,
    updateEnrollmentDto: UpdateTestSeriesEnrollmentDto,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    // Check if enrollment exists
    const existingEnrollment =
      await this.prisma.testSeriesEnrollment.findUnique({
        where: { id },
      });

    if (!existingEnrollment) {
      throw new NotFoundException(
        `Test Series Enrollment with ID ${id} not found`,
      );
    }

    // Update enrollment
    return this.prisma.testSeriesEnrollment.update({
      where: { id },
      data: {
        testsAttempted: updateEnrollmentDto.testsAttempted,
        averageScore: updateEnrollmentDto.averageScore,
      },
    });
  }

  async updateEnrollmentProgress(
    enrollmentId: string,
    newTestsAttempted: number,
    newAverageScore: number,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    const enrollment = await this.prisma.testSeriesEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Test Series Enrollment with ID ${enrollmentId} not found`,
      );
    }

    return this.prisma.testSeriesEnrollment.update({
      where: { id: enrollmentId },
      data: {
        testsAttempted: newTestsAttempted,
        averageScore: newAverageScore,
      },
    });
  }

  async getEnrollmentStats(
    testSeriesId: string,
  ): Promise<TestSeriesEnrollmentStatsDto> {
    // Check if test series exists
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id: testSeriesId },
    });

    if (!testSeries) {
      throw new NotFoundException(
        `Test Series with ID ${testSeriesId} not found`,
      );
    }

    // Get enrollment statistics
    const totalEnrollments = await this.prisma.testSeriesEnrollment.count({
      where: {
        testSeriesId,
      },
    });

    const activeEnrollments = await this.prisma.testSeriesEnrollment.count({
      where: {
        testSeriesId,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Calculate completed tests
    const enrollments = await this.prisma.testSeriesEnrollment.findMany({
      where: {
        testSeriesId,
      },
      select: {
        testsAttempted: true,
        averageScore: true,
      },
    });

    const completedTests = enrollments.reduce(
      (sum, enrollment) => sum + enrollment.testsAttempted,
      0,
    );

    // Calculate average score
    let totalScores = 0;
    let enrollmentsWithScores = 0;

    enrollments.forEach((enrollment) => {
      if (enrollment.averageScore !== null) {
        totalScores += enrollment.averageScore;
        enrollmentsWithScores++;
      }
    });

    const averageScore =
      enrollmentsWithScores > 0 ? totalScores / enrollmentsWithScores : 0;

    return {
      totalEnrollments,
      activeEnrollments,
      completedTests,
      averageScore,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.prisma.testSeriesEnrollment.delete({
      where: { id },
    });

    return { message: 'Test Series Enrollment deleted successfully' };
  }

  // Method to get all enrollment IDs for a user
  async getUserTestSeriesEnrollmentIds(userId: string): Promise<string[]> {
    const enrollments = await this.prisma.testSeriesEnrollment.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    return enrollments.map((enrollment) => enrollment.id);
  }

  // Method to get all enrollment IDs for a test series
  async getTestSeriesEnrollmentIds(testSeriesId: string): Promise<string[]> {
    const enrollments = await this.prisma.testSeriesEnrollment.findMany({
      where: {
        testSeriesId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    return enrollments.map((enrollment) => enrollment.id);
  }
}
