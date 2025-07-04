import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTestSeriesDto,
  UpdateTestSeriesDto,
  QueryTestSeriesDto,
} from '../dto';
import { TestSeries, UserRole } from 'generated/prisma';
import {
  PaginatedResponse,
  createPaginatedResponse,
  PaginatedResult,
} from '../../util/pagination';

@Injectable()
export class TestSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    teacherId: string,
    createTestSeriesDto: CreateTestSeriesDto,
  ): Promise<TestSeries> {
    return await this.prisma.testSeries.create({
      data: {
        title: createTestSeriesDto.title,
        description: createTestSeriesDto.description,
        type: createTestSeriesDto.type,
        price: createTestSeriesDto.price,
        isActive: createTestSeriesDto.isActive ?? true,
        teacherId: teacherId,
        images: createTestSeriesDto.images,
        exams: {
          connect: createTestSeriesDto.examIds.map((examId) => ({
            id: examId,
          })),
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    queryDto: QueryTestSeriesDto,
    userRole: UserRole,
    userId: string,
  ): Promise<PaginatedResponse<TestSeries>> {
    const {
      page = 1,
      pageSize = 10,
      search,
      type,
      teacherId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    // For teachers, only show their test series
    if (userRole === UserRole.TEACHER && userId) {
      where.teacherId = userId;
    }

    // Count total matching test series
    const total = await this.prisma.testSeries.count({ where });

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated test series
    const items = await this.prisma.testSeries.findMany({
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
        _count: {
          select: {
            exams: true,
          },
        },
      },
      orderBy,
    });

    // Transform to include exam count
    const transformedItems = items.map((item) => {
      const { _count, ...rest } = item;
      return {
        ...rest,
        examCount: _count.exams,
      };
    });

    // Use the pagination utility to create the response
    return createPaginatedResponse(transformedItems, total, pageSize, page);
  }

  async findOne(id: string): Promise<TestSeries> {
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
          select: {
            id: true,
            title: true,
            type: true,
            testType: true,
            subject: true,
            duration: true,
            totalMarks: true,
            difficulty: true,
            isFree: true,
            totalQuestions: true,
          },
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            exams: true,
          },
        },
      },
    });

    if (!testSeries) {
      throw new NotFoundException(`Test series with ID ${id} not found`);
    }

    return testSeries;
  }

  async update(
    id: string,
    teacherId: string,
    updateTestSeriesDto: UpdateTestSeriesDto,
  ): Promise<TestSeries> {
    // Check if test series exists
    const existingTestSeries = await this.prisma.testSeries.findUnique({
      where: { id },
    });

    if (!existingTestSeries) {
      throw new NotFoundException(`Test series with ID ${id} not found`);
    }

    // Check if the teacher is associated with this test series
    const isTeacherAssociated = existingTestSeries.teacherId === teacherId;
    if (!isTeacherAssociated) {
      throw new ForbiddenException(
        'You can only update test series you are associated with',
      );
    }

    // Prepare the update data
    const updateData: any = {};

    if (updateTestSeriesDto.title !== undefined)
      updateData.title = updateTestSeriesDto.title;
    if (updateTestSeriesDto.description !== undefined)
      updateData.description = updateTestSeriesDto.description;
    if (updateTestSeriesDto.type !== undefined)
      updateData.type = updateTestSeriesDto.type;
    if (updateTestSeriesDto.price !== undefined)
      updateData.price = updateTestSeriesDto.price;
    if (updateTestSeriesDto.isActive !== undefined)
      updateData.isActive = updateTestSeriesDto.isActive;

    // Update the test series
    return this.prisma.testSeries.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, teacherId: string): Promise<void> {
    // Check if test series exists
    const existingTestSeries = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        exams: true,
      },
    });

    if (!existingTestSeries) {
      throw new NotFoundException(`Test series with ID ${id} not found`);
    }

    // Check if the teacher is associated with this test series
    const isTeacherAssociated = existingTestSeries.teacherId === teacherId;
    if (!isTeacherAssociated) {
      throw new ForbiddenException(
        'You can only delete test series you are associated with',
      );
    }

    // Check if there are exams in this test series
    if (existingTestSeries.exams.length > 0) {
      // Instead of deleting, just mark as inactive
      await this.prisma.testSeries.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // If no exams, we can safely delete
      await this.prisma.testSeries.delete({
        where: { id },
      });
    }
  }

  async getTestSeriesByTeacher(
    teacherId: string,
    queryDto: QueryTestSeriesDto,
    userRole: UserRole,
    userId: string,
  ): Promise<PaginatedResult<TestSeries>> {
    return this.findAll({ ...queryDto, teacherId }, userRole, userId);
  }

  async addExamToTestSeries(
    testSeriesId: string,
    examId: string,
    teacherId: string,
  ): Promise<TestSeries> {
    // Check if test series exists
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id: testSeriesId },
    });

    if (!testSeries) {
      throw new NotFoundException(
        `Test series with ID ${testSeriesId} not found`,
      );
    }

    // Check if the teacher is associated with this test series
    const isTeacherAssociated = testSeries.teacherId === teacherId;
    if (!isTeacherAssociated) {
      throw new ForbiddenException(
        'You can only modify test series you are associated with',
      );
    }

    // Check if exam exists and belongs to the teacher
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only add your own exams to a test series',
      );
    }

    // Add exam to test series
    return this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        exams: {
          connect: { id: examId },
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async removeExamFromTestSeries(
    testSeriesId: string,
    examId: string,
    teacherId: string,
  ): Promise<TestSeries> {
    // Check if test series exists
    const testSeries = await this.prisma.testSeries.findUnique({
      where: { id: testSeriesId },
    });

    if (!testSeries) {
      throw new NotFoundException(
        `Test series with ID ${testSeriesId} not found`,
      );
    }

    // Check if the teacher is associated with this test series
    const isTeacherAssociated = testSeries.teacherId === teacherId;
    if (!isTeacherAssociated) {
      throw new ForbiddenException(
        'You can only modify test series you are associated with',
      );
    }

    // Check if exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    // Remove exam from test series
    return this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        exams: {
          disconnect: { id: examId },
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        exams: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}
