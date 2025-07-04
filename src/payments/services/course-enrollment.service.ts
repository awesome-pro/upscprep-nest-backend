import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Purchase } from '../../../generated/prisma';

@Injectable()
export class CourseEnrollmentService {
  private readonly logger = new Logger(CourseEnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process course enrollment after successful payment
   * @param purchase The completed purchase record
   * @returns The created enrollment
   */
  async processCourseEnrollment(purchase: Purchase) {
    try {
      if (!purchase.courseId) {
        throw new NotFoundException('Course ID not found in purchase');
      }

      // Get course details to calculate total lessons
      const course = await this.prisma.course.findUnique({
        where: { id: purchase.courseId },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException(
          `Course with ID ${purchase.courseId} not found`,
        );
      }

      // Calculate total lessons across all modules
      let totalLessons = 0;
      course.modules.forEach((module) => {
        totalLessons += module.lessons.length;
      });

      // Create course enrollment
      const enrollment = await this.prisma.courseEnrollment.create({
        data: {
          userId: purchase.userId,
          courseId: purchase.courseId,
          purchaseId: purchase.id,
          startDate: purchase.validFrom,
          endDate: purchase.validTill,
          totalLessons: totalLessons,
          isActive: true,
        },
      });

      // Update course total students count
      await this.prisma.course.update({
        where: { id: purchase.courseId },
        data: {
          totalStudents: { increment: 1 },
        },
      });

      return enrollment;
    } catch (error) {
      this.logger.error(
        `Error processing course enrollment: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all enrollments for a user
   * @param userId User ID
   * @returns List of enrollments with course details
   */
  async getUserEnrollments(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            subject: true,
          },
        },
      },
    });
  }

  /**
   * Check if a user is enrolled in a specific course
   * @param userId User ID
   * @param courseId Course ID
   * @returns Boolean indicating if user is enrolled
   */
  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    return !!enrollment;
  }
}
