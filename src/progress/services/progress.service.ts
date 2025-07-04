import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProgressDto } from '../dto/update-progress.dto';
import { EntityType } from 'generated/prisma';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update or create user progress for a specific entity
   */
  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const {
      entityId,
      entityType,
      timeSpent,
      lastPosition,
      isCompleted,
      accuracy,
      score,
      metadata,
    } = dto;

    // Get existing progress or create new one
    const existingProgress = await this.prisma.userProgress.findUnique({
      where: {
        userId_entityId_entityType: {
          userId,
          entityId,
          entityType,
        },
      },
    });

    // Prepare update data
    const updateData: any = {};

    // Handle time spent (accumulate)
    if (timeSpent) {
      updateData.timeSpent = (existingProgress?.timeSpent || 0) + timeSpent;
    }

    // Handle last position (only update if newer)
    if (lastPosition !== undefined) {
      updateData.lastPosition = lastPosition;
    }

    // Handle completion status
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted && !existingProgress?.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    // Handle accuracy and score
    if (accuracy !== undefined) {
      updateData.accuracy = accuracy;
    }

    if (score !== undefined) {
      updateData.score = score;
    }

    // Handle metadata (merge with existing)
    if (metadata) {
      const existingMetadata = existingProgress?.metadata || {};
      updateData.metadata = {
        ...(existingMetadata as Record<string, any>),
        ...metadata,
      };
    }

    // Update visit count and last accessed
    updateData.visitCount = (existingProgress?.visitCount || 0) + 1;
    updateData.lastAccessedAt = new Date();

    // Update weekly and monthly progress
    updateData.weeklyProgress = this.updateWeeklyProgress(
      existingProgress?.weeklyProgress,
      dto,
    );
    updateData.monthlyProgress = this.updateMonthlyProgress(
      existingProgress?.monthlyProgress,
      dto,
    );

    // Create or update the progress record
    return this.prisma.userProgress.upsert({
      where: {
        userId_entityId_entityType: {
          userId,
          entityId,
          entityType,
        },
      },
      update: updateData,
      create: {
        userId,
        entityId,
        entityType,
        ...updateData,
      },
    });
  }

  /**
   * Get user progress for a specific entity
   */
  async getProgress(userId: string, entityId: string, entityType: EntityType) {
    return this.prisma.userProgress.findUnique({
      where: {
        userId_entityId_entityType: {
          userId,
          entityId,
          entityType,
        },
      },
    });
  }

  /**
   * Get all progress for a user by entity type
   */
  async getAllProgressByType(userId: string, entityType: EntityType) {
    return this.prisma.userProgress.findMany({
      where: {
        userId,
        entityType,
      },
      select: {
        accuracy: true,
        score: true,
        timeSpent: true,
        visitCount: true,
        lastAccessedAt: true,
        completedAt: true,
        isCompleted: true,
        weeklyProgress: true,
        monthlyProgress: true,
      },
      orderBy: {
        lastAccessedAt: 'desc',
      },
    });
  }

  /**
   * Get user progress summary across all entity types
   */
  async getProgressSummary(userId: string) {
    // Get counts by entity type and completion status
    const progressCounts = await this.prisma.userProgress.groupBy({
      by: ['entityType', 'isCompleted'],
      where: {
        userId,
      },
      _count: {
        entityId: true,
      },
    });

    // Get total time spent by entity type
    const timeSpent = await this.prisma.userProgress.groupBy({
      by: ['entityType'],
      where: {
        userId,
      },
      _sum: {
        timeSpent: true,
      },
    });

    // Format the summary data
    const summary = {
      totalEntities: 0,
      totalCompleted: 0,
      totalTimeSpentSeconds: 0,
      byEntityType: {},
    };

    // Process counts
    progressCounts.forEach((item) => {
      const entityType = item.entityType;
      const count = item._count.entityId;
      const isCompleted = item.isCompleted;

      // Initialize entity type if not exists
      if (!summary.byEntityType[entityType]) {
        summary.byEntityType[entityType] = {
          total: 0,
          completed: 0,
          timeSpentSeconds: 0,
        };
      }

      // Update counts
      summary.byEntityType[entityType].total += count;
      summary.totalEntities += count;

      if (isCompleted) {
        summary.byEntityType[entityType].completed += count;
        summary.totalCompleted += count;
      }
    });

    // Process time spent
    timeSpent.forEach((item) => {
      const entityType = item.entityType;
      const seconds = item._sum.timeSpent || 0;

      if (summary.byEntityType[entityType]) {
        summary.byEntityType[entityType].timeSpentSeconds = seconds;
        summary.totalTimeSpentSeconds += seconds;
      }
    });

    return summary;
  }

  /**
   * Update weekly progress data
   */
  private updateWeeklyProgress(existingData: any, dto: UpdateProgressDto) {
    const weekData = existingData || {};
    const currentWeek = this.getCurrentWeekNumber();

    // Initialize current week if not exists
    if (!weekData[currentWeek]) {
      weekData[currentWeek] = {
        timeSpent: 0,
        visits: 0,
        completed: false,
      };
    }

    // Update week data
    if (dto.timeSpent) {
      weekData[currentWeek].timeSpent += dto.timeSpent;
    }

    weekData[currentWeek].visits += 1;

    if (dto.isCompleted) {
      weekData[currentWeek].completed = true;
    }

    // Keep only last 4 weeks
    const weeks = Object.keys(weekData)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .slice(0, 4);

    const result = {};
    weeks.forEach((week) => {
      result[week] = weekData[week];
    });

    return result;
  }

  /**
   * Update monthly progress data
   */
  private updateMonthlyProgress(existingData: any, dto: UpdateProgressDto) {
    const monthData = existingData || {};
    const currentMonth = this.getCurrentMonth();

    // Initialize current month if not exists
    if (!monthData[currentMonth]) {
      monthData[currentMonth] = {
        timeSpent: 0,
        visits: 0,
        completed: false,
      };
    }

    // Update month data
    if (dto.timeSpent) {
      monthData[currentMonth].timeSpent += dto.timeSpent;
    }

    monthData[currentMonth].visits += 1;

    if (dto.isCompleted) {
      monthData[currentMonth].completed = true;
    }

    // Keep only last 12 months
    const months = Object.keys(monthData)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .slice(0, 12);

    const result = {};
    months.forEach((month) => {
      result[month] = monthData[month];
    });

    return result;
  }

  /**
   * Get current week number (YYYY-WW format)
   */
  private getCurrentWeekNumber(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const weekNumber = Math.ceil((dayOfYear + start.getDay() + 1) / 7);

    return `${now.getFullYear()}-${weekNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get current month (YYYY-MM format)
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}
