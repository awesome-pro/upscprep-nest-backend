import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTeacherDto,
  TeacherStudentsQueryDto,
  UpdateTeacherDto,
} from '../dto/teacher.dto';
import { UserRole, UserStatus } from '../../../generated/prisma';
import * as bcrypt from 'bcrypt';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';
import { UserQueryDto } from '../dto/user-query.dto';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get a teacher by ID
   */
  async getTeacherById(id: string) {
    const teacher = await this.prisma.user.findUnique({
      where: {
        id,
        role: UserRole.TEACHER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        _count: {
          select: {
            createdCourses: true,
            createdExams: true,
            createdTestSeries: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  /**
   * Get all teachers with pagination and filters
   */
  async getAllTeachers(query: UserQueryDto): Promise<PaginatedResponse<any>> {
    const { search, status, page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: any = {
      role: UserRole.TEACHER,
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

    // Get paginated teachers
    const teachers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        _count: {
          select: {
            createdCourses: true,
            createdExams: true,
            createdTestSeries: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { enrollmentDate: 'desc' },
    });

    return createPaginatedResponse(teachers, total, pageSize, page);
  }

  /**
   * Create a new teacher
   */
  async createTeacher(createTeacherDto: CreateTeacherDto) {
    const { email, password, name, phoneNumber, dateOfBirth, specialization } =
      createTeacherDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create teacher
    const teacher = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        dateOfBirth,
        role: UserRole.TEACHER,
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

    return teacher;
  }

  /**
   * Update a teacher
   */
  async updateTeacher(id: string, updateTeacherDto: UpdateTeacherDto) {
    // Check if teacher exists
    const existingTeacher = await this.prisma.user.findUnique({
      where: {
        id,
        role: UserRole.TEACHER,
      },
    });

    if (!existingTeacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Update teacher
    const updatedTeacher = await this.prisma.user.update({
      where: { id },
      data: updateTeacherDto,
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

    return updatedTeacher;
  }

  /**
   * Get students enrolled in a teacher's courses or test series
   */
  async getTeacherStudents(
    teacherId: string,
    query: TeacherStudentsQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const { courseId, testSeriesId, page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    // Check if teacher exists
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
        role: UserRole.TEACHER,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Build where conditions based on courseId or testSeriesId
    let where: any = {};

    if (courseId) {
      // Students enrolled in a specific course by this teacher
      where = {
        courseEnrollments: {
          some: {
            course: {
              id: courseId,
              teacherId,
            },
          },
        },
      };
    } else if (testSeriesId) {
      // Students enrolled in a specific test series by this teacher
      where = {
        testSeriesEnrollments: {
          some: {
            testSeries: {
              id: testSeriesId,
              teacherId,
            },
          },
        },
      };
    } else {
      // All students enrolled in any course or test series by this teacher
      where = {
        OR: [
          {
            courseEnrollments: {
              some: {
                course: {
                  teacherId,
                },
              },
            },
          },
          {
            testSeriesEnrollments: {
              some: {
                testSeries: {
                  teacherId,
                },
              },
            },
          },
        ],
      };
    }

    // Add student role condition
    where.role = UserRole.STUDENT;

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
        enrollmentDate: true,
        status: true,
        courseEnrollments: {
          where: courseId
            ? { courseId }
            : {
                course: {
                  teacherId,
                },
              },
          select: {
            courseId: true,
            startDate: true,
            endDate: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        testSeriesEnrollments: {
          where: testSeriesId
            ? { testSeriesId }
            : {
                testSeries: {
                  teacherId,
                },
              },
          select: {
            testSeriesId: true,
            startDate: true,
            endDate: true,
            testSeries: {
              select: {
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { name: 'asc' },
    });

    return createPaginatedResponse(students, total, pageSize, page);
  }

  /**
   * Get teacher's content (courses, exams, test series)
   */
  async getTeacherContent(teacherId: string) {
    // Check if teacher exists
    const teacher = await this.prisma.user.findUnique({
      where: {
        id: teacherId,
        role: UserRole.TEACHER,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get courses
    const courses = await this.prisma.course.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        subject: true,
        isActive: true,
        totalStudents: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    // Get test series
    const testSeries = await this.prisma.testSeries.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        isActive: true,
        _count: {
          select: {
            exams: true,
            enrollments: true,
          },
        },
      },
    });

    // Get exams
    const exams = await this.prisma.exam.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
        type: true,
        testType: true,
        isActive: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    return {
      courses,
      testSeries,
      exams,
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
