import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CourseType, UserRole } from 'generated/prisma';
import { CourseDto, CourseListDto } from '../dto/course.dto';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(
    teacherId: string,
    createCourseDto: CreateCourseDto,
  ): Promise<CourseDto> {
    const {
      title,
      description,
      type,
      subject,
      price,
      duration,
      features,
      isPremium,
      isActive,
      images,
    } = createCourseDto;

    return await this.prisma.course.create({
      data: {
        title,
        description,
        type,
        subject: subject || 'GS1',
        price,
        duration: duration || 365,
        features,
        isPremium: isPremium !== undefined ? isPremium : true,
        isActive: isActive !== undefined ? isActive : true,
        teacherId,
        images,
      },
    });
  }

  async findAllCourses() {
    return await this.prisma.course.findMany({
      where: {
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
        modules: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<CourseDto> {
    // Check if course exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Update course
    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if course exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Delete course
    await this.prisma.course.delete({
      where: { id },
    });

    return { message: `Course with ID ${id} successfully deleted` };
  }

  async findAllPaginated(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    filters?: {
      type?: CourseType;
      subject?: string;
      isActive?: boolean;
      isPremium?: boolean;
    },
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginatedResponse<CourseListDto>> {
    const where: any = {};

    // Apply search if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply filters if provided
    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.subject) where.subject = filters.subject;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;
    }

    // For teachers, only show their courses
    if (userRole === UserRole.TEACHER && userId) {
      where.teacherId = userId;
    }

    // Count total matching courses
    const total = await this.prisma.course.count({ where });

    // Get paginated courses
    const courses = await this.prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to DTOs
    const courseDtos = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      subject: course.subject,
      price: course.price,
      duration: course.duration,
      features: course.features,
      isActive: course.isActive,
      isPremium: course.isPremium,
      totalStudents: course._count.enrollments,
      totalModules: course._count.modules,
      totalDuration: course.totalDuration,
      teacherName: course.teacher.name,
      teacherId: course.teacherId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      images: course.images,
    }));

    return createPaginatedResponse(courseDtos, total, pageSize, page);
  }

  async getTeacherCourses(teacherId: string): Promise<CourseListDto[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        teacherId,
      },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      subject: course.subject,
      price: course.price,
      duration: course.duration,
      features: course.features,
      isActive: course.isActive,
      isPremium: course.isPremium,
      totalStudents: course.totalStudents,
      totalModules: course.totalModules,
      totalDuration: course.totalDuration,
      teacherName: course.teacher.name,
      images: course.images,
    }));
  }

  async updateCourseStats(courseId: string): Promise<void> {
    // Get total students
    const totalStudents = await this.prisma.courseEnrollment.count({
      where: {
        courseId,
        isActive: true,
      },
    });

    // Get total modules
    const totalModules = await this.prisma.courseModule.count({
      where: {
        courseId,
        isActive: true,
      },
    });

    // Calculate total duration
    const lessons = await this.prisma.courseLesson.findMany({
      where: {
        module: {
          courseId,
        },
      },
      select: {
        videoDuration: true,
      },
    });

    const totalDuration = lessons.reduce((total, lesson) => {
      return total + (lesson.videoDuration || 0);
    }, 0);

    // Update course stats
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalStudents,
        totalModules,
        totalDuration: Math.ceil(totalDuration / 60), // Convert seconds to minutes
      },
    });
  }

  async findCourses(userId?: string): Promise<CourseListDto[]> {
    const courses = await this.prisma.course.findMany({
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

    const coursesWithPurchaseInfo = await Promise.all(
      courses.map(async (course) => {
        let isPurchased = false;

        if (userId) {
          // Check if user has purchased this course
          const purchase = await this.prisma.purchase.findFirst({
            where: {
              userId,
              courseId: course.id,
              status: 'COMPLETED',
              validTill: {
                gte: new Date(),
              },
            },
          });

          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          type: course.type,
          subject: course.subject,
          price: course.price,
          duration: course.duration,
          features: course.features,
          isActive: course.isActive,
          isPremium: course.isPremium,
          totalStudents: course.totalStudents,
          totalModules: course.totalModules,
          totalDuration: course.totalDuration,
          teacherName: course.teacher.name,
          images: course.images,
          isPurchased,
        };
      }),
    );

    return coursesWithPurchaseInfo;
  }

  async findByType(
    type: CourseType,
    userId?: string,
  ): Promise<CourseListDto[]> {
    const courses = await this.prisma.course.findMany({
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

    const coursesWithPurchaseInfo = await Promise.all(
      courses.map(async (course) => {
        let isPurchased = false;

        if (userId) {
          // Check if user has purchased this course
          const purchase = await this.prisma.purchase.findFirst({
            where: {
              userId,
              courseId: course.id,
              status: 'COMPLETED',
              validTill: {
                gte: new Date(),
              },
            },
          });

          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          type: course.type,
          subject: course.subject,
          price: course.price,
          duration: course.duration,
          features: course.features,
          isActive: course.isActive,
          isPremium: course.isPremium,
          totalStudents: course.totalStudents,
          totalModules: course.totalModules,
          totalDuration: course.totalDuration,
          teacherName: course.teacher.name,
          images: course.images,
          isPurchased,
        };
      }),
    );

    return coursesWithPurchaseInfo;
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        modules: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                isPreview: true,
                isMandatory: true,
                videoDuration: true,
                textContent: true,
                videoUrls: true,
                fileUrls: true,
                quizData: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    let isPurchased = false;
    let purchaseId = '';
    let validTill = new Date();

    if (userId) {
      // Check if user has purchased this course
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          userId,
          courseId: course.id,
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

    // Format modules and lessons
    const modules = course.modules.map((module) => {
      const lessons = module.lessons.map((lesson) => {
        // If course is not purchased and lesson is not preview, hide content
        const isAccessible = isPurchased || lesson.isPreview;

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description ?? undefined,
          order: lesson.order,
          isPreview: lesson.isPreview,
          isMandatory: lesson.isMandatory,
          videoDuration: lesson.videoDuration ?? 0,
          // Only include content if accessible
          textContent: isAccessible
            ? (lesson.textContent ?? undefined)
            : undefined,
          videoUrls: isAccessible ? lesson.videoUrls : [],
          fileUrls: isAccessible ? lesson.fileUrls : [],
          quizData: isAccessible ? lesson.quizData : undefined,
        };
      });

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        isActive: module.isActive,
        lessons,
      };
    });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      subject: course.subject,
      price: course.price,
      duration: course.duration,
      features: course.features,
      isActive: course.isActive,
      totalStudents: course.totalStudents,
      totalModules: course.totalModules,
      totalDuration: course.totalDuration,
      teacherId: course.teacherId,
      teacherName: course.teacher.name,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      images: course.images,
      modules,
      isPurchased,
      purchaseId,
      validTill,
    };
  }

  async checkUserAccess(userId: string, courseId: string): Promise<boolean> {
    // Check if the course is free
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { isPremium: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // If course is not premium, user has access
    if (!course.isPremium) {
      return true;
    }

    // Check if user has purchased this course and it's still valid
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        courseId,
        status: 'COMPLETED',
        validTill: {
          gte: new Date(),
        },
      },
    });

    return !!purchase;
  }
}
