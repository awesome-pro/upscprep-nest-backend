import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, QueryExamDto } from '../dto';
import { Exam, ExamDifficulty, UserRole } from 'generated/prisma';
import { PaginatedResult } from '../../util/pagination';

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(teacherId: string, createExamDto: CreateExamDto): Promise<Exam> {
    // Verify the user is a teacher
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create exams');
    }
    // Create the exam
    return this.prisma.exam.create({
      data: {
        title: createExamDto.title,
        description: createExamDto.description,
        type: createExamDto.type,
        testType: createExamDto.testType,
        subject: createExamDto.subject,
        testSeriesId: createExamDto.testSeriesId,
        fileUrls: createExamDto.fileUrls,
        teacherId: teacherId,
        duration: createExamDto.duration,
        totalMarks: createExamDto.totalMarks,
        negativeMarking: createExamDto.negativeMarking,
        correctMark: createExamDto.correctMark,
        incorrectMark: createExamDto.incorrectMark,
        difficulty: createExamDto.difficulty ?? ExamDifficulty.EASY,
        tags: createExamDto.tags,
        isActive: createExamDto.isActive ?? true,
        isFree: createExamDto.isFree ?? false,
        totalQuestions: createExamDto.totalQuestions ?? 0,
      },
    });
  }

  async findAll(
    queryDto: QueryExamDto,
    userRole?: UserRole,
    userId?: string,
  ): Promise<PaginatedResult<Exam>> {
    const {
      page = 1,
      pageSize = 10,
      search,
      type,
      testType,
      subject,
      testSeriesId,
      teacherId,
      difficulty,
      tag,
      isActive,
      isFree,
    } = queryDto;

    // Build the where clause based on filters
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (testType) where.testType = testType;
    if (subject) where.subject = subject;
    if (testSeriesId) where.testSeriesId = testSeriesId;
    if (difficulty) where.difficulty = difficulty;
    if (tag) where.tags = { has: tag };
    if (isActive !== undefined) where.isActive = isActive;
    if (isFree !== undefined) where.isFree = isFree;

    // Role-based filtering
    if (userRole && userId) {
      // For TEACHER: Only show exams created by this teacher
      if (userRole === UserRole.TEACHER) {
        where.teacherId = userId;
      }

      // For STUDENT: Only show exams from courses/test series they're enrolled in, or free exams
      else if (userRole === UserRole.STUDENT) {
        // Get courses the student is enrolled in
        const courseEnrollments = await this.prisma.courseEnrollment.findMany({
          where: {
            userId,
            isActive: true,
            endDate: { gte: new Date() }, // Only active enrollments
          },
          select: { courseId: true },
        });

        // Get test series the student is enrolled in
        const testSeriesEnrollments =
          await this.prisma.testSeriesEnrollment.findMany({
            where: {
              userId,
              isActive: true,
              endDate: { gte: new Date() }, // Only active enrollments
            },
            select: { testSeriesId: true },
          });

        const enrolledCourseIds = courseEnrollments.map((e) => e.courseId);
        const enrolledTestSeriesIds = testSeriesEnrollments.map(
          (e) => e.testSeriesId,
        );

        // Show exams that are either:
        // 1. From courses the student is enrolled in, OR
        // 2. From test series the student is enrolled in, OR
        // 3. Free exams
        where.OR = [
          ...(where.OR || []),
          { isFree: true },
          {
            courseId: {
              in: enrolledCourseIds.length > 0 ? enrolledCourseIds : undefined,
            },
          },
          {
            testSeriesId: {
              in:
                enrolledTestSeriesIds.length > 0
                  ? enrolledTestSeriesIds
                  : undefined,
            },
          },
        ];
      }
      // For ADMIN: Show all exams (no additional filtering needed)
    }

    // Count total items for pagination
    const totalItems = await this.prisma.exam.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get paginated results
    const items = await this.prisma.exam.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        testSeries: {
          select: {
            id: true,
            title: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform items to include attempt count
    const transformedItems = items.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...rest,
        attemptsCount: _count.attempts,
      };
    });

    return {
      data: transformedItems,
      meta: {
        total: totalItems,
        pageSize,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        testSeries: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  async update(
    id: string,
    teacherId: string,
    updateExamDto: UpdateExamDto,
  ): Promise<Exam> {
    // Check if exam exists and belongs to the teacher
    const existingExam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    if (existingExam.teacherId !== teacherId) {
      throw new ForbiddenException('You can only update your own exams');
    }

    // Update the exam
    return this.prisma.exam.update({
      where: { id },
      data: {
        title: updateExamDto.title,
        description: updateExamDto.description,
        type: updateExamDto.type,
        testType: updateExamDto.testType,
        subject: updateExamDto.subject,
        testSeriesId: updateExamDto.testSeriesId,
        fileUrls: updateExamDto.fileUrls,
        duration: updateExamDto.duration,
        totalMarks: updateExamDto.totalMarks,
        negativeMarking: updateExamDto.negativeMarking,
        correctMark: updateExamDto.correctMark,
        incorrectMark: updateExamDto.incorrectMark,
        difficulty: updateExamDto.difficulty,
        tags: updateExamDto.tags,
        isActive: updateExamDto.isActive,
        isFree: updateExamDto.isFree,
        totalQuestions: updateExamDto.totalQuestions,
      },
    });
  }

  async remove(id: string, teacherId: string): Promise<void> {
    // Check if exam exists and belongs to the teacher
    const existingExam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    if (existingExam.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own exams');
    }

    // Check if there are any attempts for this exam
    const attemptsCount = await this.prisma.attempt.count({
      where: { examId: id },
    });

    if (attemptsCount > 0) {
      // Instead of deleting, just mark as inactive
      await this.prisma.exam.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // If no attempts, we can safely delete
      await this.prisma.exam.delete({
        where: { id },
      });
    }
  }

  async getExamsByTeacher(
    teacherId: string,
    queryDto: QueryExamDto,
  ): Promise<PaginatedResult<Exam>> {
    return this.findAll({ ...queryDto, teacherId });
  }

  async getExamsByTestSeries(
    testSeriesId: string,
    queryDto: QueryExamDto,
  ): Promise<PaginatedResult<Exam>> {
    return this.findAll({ ...queryDto, testSeriesId });
  }
}
