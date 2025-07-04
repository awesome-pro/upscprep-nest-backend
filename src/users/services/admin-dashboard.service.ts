import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async countUsers() {
    return this.prisma.user.count();
  }

  async countUsersByRole() {
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Convert to a more convenient format
    const result = {};
    usersByRole.forEach((item) => {
      result[item.role] = item._count.id;
    });

    return result;
  }

  async countNewUsersInLastDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: date,
        },
      },
    });
  }

  async countActiveUsersInLastDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    // Count users who have logged in within the specified period
    return this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: date,
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
  }) {
    const { skip, take, orderBy, where } = params;
    const totalCount = await this.prisma.user.count({ where });

    const items = await this.prisma.user.findMany({
      skip,
      take,
      orderBy,
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return {
      items,
      totalCount,
      pageCount: Math.ceil(totalCount / (take || 1)),
    };
  }

  // Course statistics methods
  async countCourses() {
    return this.prisma.course.count();
  }

  async countActiveCourses() {
    return this.prisma.course.count({
      where: {
        isActive: true,
      },
    });
  }

  async countTotalEnrollments() {
    return this.prisma.courseEnrollment.count();
  }

  async getAverageCompletionRate() {
    const result = await this.prisma.userProgress.aggregate({
      _avg: {
        percentageCompleted: true,
      },
      where: {
        entityType: 'COURSE',
      },
    });

    return Math.round(result._avg.percentageCompleted || 0);
  }

  // Test series statistics methods
  async countTestSeries() {
    return this.prisma.testSeries.count();
  }

  async countActiveTestSeries() {
    return this.prisma.testSeries.count({
      where: {
        isActive: true,
      },
    });
  }

  async countTestSeriesEnrollments() {
    return this.prisma.testSeriesEnrollment.count();
  }

  async countTotalAttempts() {
    return this.prisma.attempt.count();
  }

  async getAverageScore() {
    const result = await this.prisma.attempt.aggregate({
      _avg: {
        score: true,
      },
    });

    return Math.round(result._avg.score || 0);
  }
}
