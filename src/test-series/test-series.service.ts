import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TestSeriesDto,
  TestSeriesListDto,
  TestSeriesDetailDto,
} from './dto/test-series.dto';
import { ExamType } from 'generated/prisma';

@Injectable()
export class TestSeriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string): Promise<TestSeriesListDto[]> {
    const testSeries = await this.prisma.testSeries.findMany({
      where: {
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    const testSeriesWithPurchaseInfo = await Promise.all(
      testSeries.map(async (series) => {
        let isPurchased = false;

        if (userId) {
          // Check if user has purchased this test series
          const purchase = await this.prisma.purchase.findFirst({
            where: {
              userId,
              testSeriesId: series.id,
              status: 'COMPLETED',
              validTill: {
                gte: new Date(),
              },
            },
          });

          isPurchased = !!purchase;
        }

        return {
          id: series.id,
          title: series.title,
          description: series.description,
          type: series.type,
          price: series.price,
          duration: series.duration,
          features: series.features,
          totalTests: series.totalTests,
          isActive: series.isActive,
          teacherName: series.teacher.name,
          isPurchased,
        };
      }),
    );

    return testSeriesWithPurchaseInfo;
  }

  async findByType(
    type: ExamType,
    userId?: string,
  ): Promise<TestSeriesListDto[]> {
    const testSeries = await this.prisma.testSeries.findMany({
      where: {
        type,
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    const testSeriesWithPurchaseInfo = await Promise.all(
      testSeries.map(async (series) => {
        let isPurchased = false;

        if (userId) {
          // Check if user has purchased this test series
          const purchase = await this.prisma.purchase.findFirst({
            where: {
              userId,
              testSeriesId: series.id,
              status: 'COMPLETED',
              validTill: {
                gte: new Date(),
              },
            },
          });

          isPurchased = !!purchase;
        }

        return {
          id: series.id,
          title: series.title,
          description: series.description,
          type: series.type,
          price: series.price,
          duration: series.duration,
          features: series.features,
          totalTests: series.totalTests,
          isActive: series.isActive,
          teacherName: series.teacher.name,
          isPurchased,
        };
      }),
    );

    return testSeriesWithPurchaseInfo;
  }

  async findOne(id: string, userId?: string): Promise<TestSeriesDetailDto> {
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        exams: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!testSeries) {
      throw new NotFoundException(`Test Series with ID ${id} not found`);
    }

    let isPurchased = false;
    let purchaseId = '';
    let validTill = new Date();

    if (userId) {
      // Check if user has purchased this test series
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          userId,
          testSeriesId: testSeries.id,
          status: 'COMPLETED',
          validTill: {
            gte: new Date(),
          },
        },
      });

      if (purchase) {
        isPurchased = true;
        purchaseId = purchase.id;
        validTill = purchase.validTill;
      }
    }

    // Format exams
    const exams = testSeries.exams.map((exam) => {
      // If test series is not purchased and exam is not free, hide some details
      const isAccessible = isPurchased || exam.isFree;

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        type: exam.type,
        testType: exam.testType,
        subject: exam.subject,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        totalQuestions: exam.totalQuestions,
        difficulty: exam.difficulty,
        isActive: exam.isActive,
        isFree: exam.isFree,
        // Only include additional details if accessible
        isAccessible,
      };
    });

    return {
      id: testSeries.id,
      title: testSeries.title,
      description: testSeries.description,
      type: testSeries.type,
      price: testSeries.price,
      duration: testSeries.duration,
      features: testSeries.features,
      totalTests: testSeries.totalTests,
      isActive: testSeries.isActive,
      teacherId: testSeries.teacherId,
      teacherName: testSeries.teacher.name,
      createdAt: testSeries.createdAt,
      updatedAt: testSeries.updatedAt,
      exams,
      isPurchased,
      purchaseId,
      validTill,
    };
  }

  async checkUserAccess(
    userId: string,
    testSeriesId: string,
  ): Promise<boolean> {
    // Check if the test series exists
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id: testSeriesId },
    });

    if (!testSeries) {
      throw new NotFoundException(
        `Test Series with ID ${testSeriesId} not found`,
      );
    }

    // Check if user has purchased this test series and it's still valid
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        testSeriesId,
        status: 'COMPLETED',
        validTill: {
          gte: new Date(),
        },
      },
    });

    return !!purchase;
  }
}
