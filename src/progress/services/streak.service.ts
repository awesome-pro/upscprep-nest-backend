import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStreakDto } from '../dto/update-streak.dto';

@Injectable()
export class StreakService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update user streak based on activity
   */
  async updateStreak(userId: string, dto: UpdateStreakDto) {
    // Get current streak or create new one
    const streak = await this.getOrCreateStreak(userId);

    // Check if this is a new day compared to last activity
    const today = new Date();
    const lastActivityDate = new Date(streak.lastActivity);
    const isNewDay = !this.isSameDay(today, lastActivityDate);

    // Prepare update data
    const updateData: any = {};

    // Handle streak counting
    if (isNewDay) {
      // Reset daily counters if it's a new day
      updateData.studyMinutes = dto.studyMinutes || 0;
      updateData.testsAttempted = dto.testsAttempted || 0;
      updateData.lessonsCompleted = dto.lessonsCompleted || 0;
      updateData.questionsAnswered = dto.questionsAnswered || 0;
      updateData.pointsEarned = dto.pointsEarned || 0;

      // Check if the last activity was yesterday
      const isConsecutiveDay = this.isConsecutiveDay(today, lastActivityDate);

      if (isConsecutiveDay) {
        // Continue the streak
        updateData.currentStreak = streak.currentStreak + 1;
        updateData.totalDays = streak.totalDays + 1;

        // Update longest streak if needed
        if (updateData.currentStreak > streak.longestStreak) {
          updateData.longestStreak = updateData.currentStreak;
        }
      } else {
        // Break in streak, reset to 1
        updateData.currentStreak = 1;
        updateData.totalDays = streak.totalDays + 1;
      }
    } else {
      // Same day, accumulate activity
      updateData.studyMinutes =
        (streak.studyMinutes || 0) + (dto.studyMinutes || 0);
      updateData.testsAttempted =
        (streak.testsAttempted || 0) + (dto.testsAttempted || 0);
      updateData.lessonsCompleted =
        (streak.lessonsCompleted || 0) + (dto.lessonsCompleted || 0);
      updateData.questionsAnswered =
        (streak.questionsAnswered || 0) + (dto.questionsAnswered || 0);
      updateData.pointsEarned =
        (streak.pointsEarned || 0) + (dto.pointsEarned || 0);
    }

    // Always update last activity time
    updateData.lastActivity = today;

    // Update daily activities record
    updateData.dailyActivities = this.updateDailyActivities(
      streak.dailyActivities,
      today,
      dto,
    );

    // Update weekly and monthly stats
    updateData.weeklyStats = this.updateWeeklyStats(
      streak.weeklyStats,
      today,
      dto,
    );
    updateData.monthlyStats = this.updateMonthlyStats(
      streak.monthlyStats,
      today,
      dto,
    );

    // Update the streak record
    return this.prisma.studentStreak.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Get user streak data
   */
  async getStreak(userId: string) {
    return this.getOrCreateStreak(userId);
  }

  /**
   * Get or create streak record for user
   */
  private async getOrCreateStreak(userId: string) {
    const streak = await this.prisma.studentStreak.findUnique({
      where: { userId },
    });

    if (streak) {
      return streak;
    }

    // Create new streak record
    return this.prisma.studentStreak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(),
        totalDays: 0,
      },
    });
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Check if two dates are consecutive days
   */
  private isConsecutiveDay(today: Date, lastActivity: Date): boolean {
    // Clone the dates to avoid modifying the originals
    const todayDate = new Date(today);
    const lastDate = new Date(lastActivity);

    // Reset hours to compare just the dates
    todayDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // Check if it's exactly 1 day difference
    return diffDays === 1;
  }

  /**
   * Update daily activities record
   */
  private updateDailyActivities(
    existingData: any,
    today: Date,
    dto: UpdateStreakDto,
  ) {
    const dailyData = existingData || {};
    const dateKey = this.formatDate(today);

    // Initialize or update today's data
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        studyMinutes: 0,
        testsAttempted: 0,
        lessonsCompleted: 0,
        questionsAnswered: 0,
        pointsEarned: 0,
      };
    }

    // Update with new activity
    if (dto.studyMinutes) dailyData[dateKey].studyMinutes += dto.studyMinutes;
    if (dto.testsAttempted)
      dailyData[dateKey].testsAttempted += dto.testsAttempted;
    if (dto.lessonsCompleted)
      dailyData[dateKey].lessonsCompleted += dto.lessonsCompleted;
    if (dto.questionsAnswered)
      dailyData[dateKey].questionsAnswered += dto.questionsAnswered;
    if (dto.pointsEarned) dailyData[dateKey].pointsEarned += dto.pointsEarned;

    // Keep only last 30 days
    const dates = Object.keys(dailyData)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 30);

    const result = {};
    dates.forEach((date) => {
      result[date] = dailyData[date];
    });

    return result;
  }

  /**
   * Update weekly stats
   */
  private updateWeeklyStats(
    existingData: any,
    today: Date,
    dto: UpdateStreakDto,
  ) {
    const weeklyData = existingData || {};
    const weekKey = this.getWeekNumber(today);

    // Initialize week if not exists
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        studyMinutes: 0,
        testsAttempted: 0,
        lessonsCompleted: 0,
        questionsAnswered: 0,
        pointsEarned: 0,
        activeDays: 0,
      };
    }

    // Update with new activity
    if (dto.studyMinutes) weeklyData[weekKey].studyMinutes += dto.studyMinutes;
    if (dto.testsAttempted)
      weeklyData[weekKey].testsAttempted += dto.testsAttempted;
    if (dto.lessonsCompleted)
      weeklyData[weekKey].lessonsCompleted += dto.lessonsCompleted;
    if (dto.questionsAnswered)
      weeklyData[weekKey].questionsAnswered += dto.questionsAnswered;
    if (dto.pointsEarned) weeklyData[weekKey].pointsEarned += dto.pointsEarned;

    // Count this as an active day if any activity occurred
    if (
      dto.studyMinutes ||
      dto.testsAttempted ||
      dto.lessonsCompleted ||
      dto.questionsAnswered ||
      dto.pointsEarned
    ) {
      // Check if we already counted this day
      const dateKey = this.formatDate(today);
      if (!weeklyData[weekKey].activeDates) {
        weeklyData[weekKey].activeDates = {};
      }

      if (!weeklyData[weekKey].activeDates[dateKey]) {
        weeklyData[weekKey].activeDates[dateKey] = true;
        weeklyData[weekKey].activeDays += 1;
      }
    }

    // Keep only last 12 weeks
    const weeks = Object.keys(weeklyData)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 12);

    const result = {};
    weeks.forEach((week) => {
      result[week] = weeklyData[week];
    });

    return result;
  }

  /**
   * Update monthly stats
   */
  private updateMonthlyStats(
    existingData: any,
    today: Date,
    dto: UpdateStreakDto,
  ) {
    const monthlyData = existingData || {};
    const monthKey = this.formatMonth(today);

    // Initialize month if not exists
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        studyMinutes: 0,
        testsAttempted: 0,
        lessonsCompleted: 0,
        questionsAnswered: 0,
        pointsEarned: 0,
        activeDays: 0,
      };
    }

    // Update with new activity
    if (dto.studyMinutes)
      monthlyData[monthKey].studyMinutes += dto.studyMinutes;
    if (dto.testsAttempted)
      monthlyData[monthKey].testsAttempted += dto.testsAttempted;
    if (dto.lessonsCompleted)
      monthlyData[monthKey].lessonsCompleted += dto.lessonsCompleted;
    if (dto.questionsAnswered)
      monthlyData[monthKey].questionsAnswered += dto.questionsAnswered;
    if (dto.pointsEarned)
      monthlyData[monthKey].pointsEarned += dto.pointsEarned;

    // Count this as an active day if any activity occurred
    if (
      dto.studyMinutes ||
      dto.testsAttempted ||
      dto.lessonsCompleted ||
      dto.questionsAnswered ||
      dto.pointsEarned
    ) {
      // Check if we already counted this day
      const dateKey = this.formatDate(today);
      if (!monthlyData[monthKey].activeDates) {
        monthlyData[monthKey].activeDates = {};
      }

      if (!monthlyData[monthKey].activeDates[dateKey]) {
        monthlyData[monthKey].activeDates[dateKey] = true;
        monthlyData[monthKey].activeDays += 1;
      }
    }

    // Keep only last 12 months
    const months = Object.keys(monthlyData)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 12);

    const result = {};
    months.forEach((month) => {
      result[month] = monthlyData[month];
    });

    return result;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format month as YYYY-MM
   */
  private formatMonth(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get week number as YYYY-WW
   */
  private getWeekNumber(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum =
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      );
    return `${d.getFullYear()}-${weekNum.toString().padStart(2, '0')}`;
  }
}
