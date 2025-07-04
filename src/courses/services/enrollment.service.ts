import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EnrollmentResponseDto,
  EnrollmentStatsDto,
  UpdateEnrollmentDto,
} from '../dto/enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async createEnrollment(
    userId: string,
    courseId: string,
    purchaseId: string,
    endDate: Date,
  ): Promise<EnrollmentResponseDto> {
    return this.prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        isActive: true,
        purchaseId,
        endDate,
      },
    });
  }

  async findUserEnrollments(userId: string): Promise<EnrollmentResponseDto[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            type: true,
            subject: true,
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

  async findCourseEnrollments(
    courseId: string,
  ): Promise<EnrollmentResponseDto[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        isActive: true,
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            type: true,
            subject: true,
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

  async findOne(id: string): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            type: true,
            subject: true,
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
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  async findUserCourseEnrollment(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
        isActive: true,
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            type: true,
            subject: true,
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
        `Enrollment for user ${userId} and course ${courseId} not found`,
      );
    }

    return enrollment;
  }

  async update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    // Check if enrollment exists
    const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id },
    });

    if (!existingEnrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    // Update enrollment
    return this.prisma.courseEnrollment.update({
      where: { id },
      data: {
        progressPercentage: updateEnrollmentDto.progressPercentage,
        completedLessons: updateEnrollmentDto.completedLessons,
        lastAccessedAt: updateEnrollmentDto.lastAccessedAt || new Date(),
      },
    });
  }

  async updateEnrollmentProgress(
    enrollmentId: string,
  ): Promise<EnrollmentResponseDto> {
    // Get enrollment with course details to calculate progress
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  where: {
                    isMandatory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    // Calculate total mandatory lessons
    let totalLessons = 0;
    enrollment.course.modules.forEach((module) => {
      totalLessons += module.lessons.length;
    });

    // Calculate progress percentage
    const progressPercentage =
      totalLessons > 0 ? (enrollment.completedLessons / totalLessons) * 100 : 0;

    // Update enrollment
    return this.prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercentage,
        completedLessons: enrollment.completedLessons,
        totalLessons,
        lastAccessedAt: new Date(),
      },
    });
  }

  async getEnrollmentStats(courseId: string): Promise<EnrollmentStatsDto> {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Get enrollment statistics
    const totalEnrollments = await this.prisma.courseEnrollment.count({
      where: {
        courseId,
      },
    });

    const activeEnrollments = await this.prisma.courseEnrollment.count({
      where: {
        courseId,
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    const completedEnrollments = await this.prisma.courseEnrollment.count({
      where: {
        courseId,
        progressPercentage: 100,
      },
    });

    // Calculate average progress
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
      },
      select: {
        progressPercentage: true,
      },
    });

    const totalProgress = enrollments.reduce(
      (sum, enrollment) => sum + enrollment.progressPercentage,
      0,
    );
    const averageProgress =
      enrollments.length > 0 ? totalProgress / enrollments.length : 0;

    return {
      totalEnrollments,
      activeEnrollments,
      completedCourses: completedEnrollments,
      averageProgress,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.prisma.courseEnrollment.delete({
      where: { id },
    });

    return { message: 'Enrollment deleted successfully' };
  }

  // Method to get all enrollment IDs for a user
  async getUserEnrollmentIds(userId: string): Promise<string[]> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
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

  // Method to get all enrollment IDs for a course
  async getCourseEnrollmentIds(courseId: string): Promise<string[]> {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        courseId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    return enrollments.map((enrollment) => enrollment.id);
  }
}
