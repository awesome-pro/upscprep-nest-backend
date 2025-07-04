import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus } from '../../../generated/prisma';
import * as bcrypt from 'bcryptjs';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';
import { UserQueryDto } from '../dto/user-query.dto';
import { CreateStudentDto, UpdateStudentDto } from '../dto/student.dto';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get a student by ID
   */
  async getStudentById(id: string) {
    const student = await this.prisma.user.findUnique({
      where: {
        id,
        role: UserRole.STUDENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        walletBalance: true,
        courseEnrollments: {
          select: {
            id: true,
            courseId: true,
            startDate: true,
            endDate: true,
            isActive: true,
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
        },
        testSeriesEnrollments: {
          select: {
            id: true,
            testSeriesId: true,
            startDate: true,
            endDate: true,
            isActive: true,
            testSeries: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * Get all students with pagination and filters
   */
  async getAllStudents(query: UserQueryDto): Promise<PaginatedResponse<any>> {
    const { search, status, page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: any = {
      role: UserRole.STUDENT,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get paginated students
    const students = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        walletBalance: true,
        _count: {
          select: {
            courseEnrollments: true,
            testSeriesEnrollments: true,
            attempts: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { enrollmentDate: 'desc' },
    });

    return createPaginatedResponse(students, total, pageSize, page);
  }

  /**
   * Create a new student
   */
  async createStudent(createStudentDto: CreateStudentDto) {
    const { email, password, name, phoneNumber, dateOfBirth } =
      createStudentDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create student
    const student = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        dateOfBirth,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
      },
    });

    return student;
  }

  /**
   * Update a student
   */
  async updateStudent(id: string, updateStudentDto: UpdateStudentDto) {
    // Check if student exists
    const existingStudent = await this.prisma.user.findUnique({
      where: {
        id,
        role: UserRole.STUDENT,
      },
    });

    if (!existingStudent) {
      throw new NotFoundException('Student not found');
    }

    // Update student
    const updatedStudent = await this.prisma.user.update({
      where: { id },
      data: updateStudentDto,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
      },
    });

    return updatedStudent;
  }

  /**
   * Get student enrollments (courses and test series)
   */
  async getStudentEnrollments(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
      },
      select: {
        courseEnrollments: {
          select: {
            id: true,
            courseId: true,
            startDate: true,
            endDate: true,
            isActive: true,
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
        },
        testSeriesEnrollments: {
          select: {
            id: true,
            testSeriesId: true,
            startDate: true,
            endDate: true,
            isActive: true,
            testSeries: {
              select: {
                id: true,
                title: true,
                description: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return {
      courseEnrollments: student.courseEnrollments,
      testSeriesEnrollments: student.testSeriesEnrollments,
    };
  }

  /**
   * Get student progress summary
   */
  async getStudentProgress(studentId: string) {
    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: {
        id: studentId,
        role: UserRole.STUDENT,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get progress data
    const progress = await this.prisma.userProgress.findMany({
      where: {
        userId: studentId,
      },
      select: {
        entityId: true,
        entityType: true,
        isCompleted: true,
        completedAt: true,
        timeSpent: true,
        accuracy: true,
        score: true,
        lastAccessedAt: true,
      },
    });

    // Get streak data
    const streak = await this.prisma.studentStreak.findUnique({
      where: {
        userId: studentId,
      },
    });

    // Get attempt stats
    const attemptStats = await this.prisma.attempt.groupBy({
      by: ['status'],
      where: {
        userId: studentId,
      },
      _count: true,
    });

    return {
      progress,
      streak,
      attemptStats,
    };
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
