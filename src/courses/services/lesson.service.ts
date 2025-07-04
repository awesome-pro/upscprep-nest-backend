import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateLessonDto,
  LessonResponseDto,
  UpdateLessonDto,
  LessonQueryParamsDto,
} from '../dto/lesson.dto';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  async create(
    moduleId: string,
    createLessonDto: CreateLessonDto,
  ): Promise<LessonResponseDto> {
    // Check if module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Create lesson with appropriate data based on content type
    const lesson = await this.prisma.courseLesson.create({
      data: {
        moduleId,
        title: createLessonDto.title ?? '',
        description: createLessonDto.description ?? '',
        order: createLessonDto.order,
        textContent: createLessonDto.textContent,
        videoUrls: createLessonDto.videoUrls || [],
        videoDuration: createLessonDto.videoDuration,
        fileUrls: createLessonDto.fileUrls || [],
        quizData: createLessonDto.quizData,
        isPreview: createLessonDto.isPreview ?? false,
        isMandatory: createLessonDto.isMandatory ?? true,
      },
    });

    if (createLessonDto.videoDuration) {
      await this.updateCourseDuration(module.courseId);
    }

    return {
      ...lesson,
      quizData: lesson.quizData as Record<string, any>,
    };
  }

  async findAll(moduleId: string): Promise<LessonResponseDto[]> {
    // Check if module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Get all lessons for the module
    const lessons = await this.prisma.courseLesson.findMany({
      where: {
        moduleId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return lessons.map((lesson) => ({
      ...lesson,
      quizData: lesson.quizData as Record<string, any>,
    }));
  }

  async findAllPaginated(
    moduleId: string,
    queryParams: LessonQueryParamsDto,
  ): Promise<PaginatedResponse<LessonResponseDto>> {
    // Check if module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Build where clause based on query params
    const where: any = {
      moduleId,
    };

    // Apply search if provided
    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
      ];
    }

    // Apply preview filter if provided
    if (queryParams.isPreview !== undefined) {
      where.isPreview = queryParams.isPreview;
    }

    // Apply mandatory filter if provided
    if (queryParams.isMandatory !== undefined) {
      where.isMandatory = queryParams.isMandatory;
    }

    // Count total matching lessons
    const total = await this.prisma.courseLesson.count({ where });

    // Get paginated lessons
    const page = queryParams.page || 1;
    const pageSize = queryParams.pageSize || 10;

    const lessons = await this.prisma.courseLesson.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: queryParams.orderBy
        ? { [queryParams.orderBy]: queryParams.orderDirection || 'asc' }
        : { order: 'asc' },
    });

    // Transform to DTOs with proper JSON handling for quizData
    const lessonDtos = lessons.map((lesson) => ({
      ...lesson,
      quizData: lesson.quizData as Record<string, any>,
    }));

    return createPaginatedResponse(lessonDtos, total, pageSize, page);
  }

  async findOne(id: string): Promise<LessonResponseDto> {
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return {
      ...lesson,
      quizData: lesson.quizData as Record<string, any>,
    };
  }

  async update(
    id: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    // Check if lesson exists
    const existingLesson = await this.prisma.courseLesson.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Update lesson
    const updatedLesson = await this.prisma.courseLesson.update({
      where: { id },
      data: updateLessonDto,
    });

    // Update course total duration if video duration changed
    if (updateLessonDto.videoDuration !== undefined) {
      await this.updateCourseDuration(existingLesson.module.courseId);
    }

    return {
      ...updatedLesson,
      quizData: updatedLesson.quizData as Record<string, any>,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if lesson exists
    const existingLesson = await this.prisma.courseLesson.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Store course ID for updating total duration
    const courseId = existingLesson.module.courseId;

    // Delete lesson
    await this.prisma.courseLesson.delete({
      where: { id },
    });

    // Update course total duration if it was a video lesson
    if (existingLesson.videoDuration) {
      await this.updateCourseDuration(courseId);
    }

    return { message: `Lesson with ID ${id} successfully deleted` };
  }

  /**
   * Bulk delete multiple lessons
   */
  async bulkRemove(ids: string[]): Promise<{ message: string }> {
    if (!ids || ids.length === 0) {
      return { message: 'No lessons to delete' };
    }

    // Get all lessons to be deleted to check if they exist and to get their module/course info
    const existingLessons = await this.prisma.courseLesson.findMany({
      where: { id: { in: ids } },
      include: {
        module: true,
      },
    });

    // Check if all lessons exist
    if (existingLessons.length !== ids.length) {
      const foundIds = existingLessons.map((lesson) => lesson.id);
      const missingIds = ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Lessons with IDs ${missingIds.join(', ')} not found`,
      );
    }

    // Get unique course IDs that need duration updates
    const coursesNeedingUpdate = new Set<string>();
    existingLessons.forEach((lesson) => {
      if (lesson.videoDuration) {
        coursesNeedingUpdate.add(lesson.module.courseId);
      }
    });

    // Delete all lessons in a transaction
    await this.prisma.courseLesson.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    // Update course durations if needed
    for (const courseId of coursesNeedingUpdate) {
      await this.updateCourseDuration(courseId);
    }

    return { message: `${ids.length} lessons successfully deleted` };
  }

  async reorderLessons(
    moduleId: string,
    lessonIds: string[],
  ): Promise<{ message: string }> {
    // Check if module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    // Validate that all lesson IDs belong to the module
    const lessons = await this.prisma.courseLesson.findMany({
      where: {
        moduleId,
        id: {
          in: lessonIds,
        },
      },
    });

    if (lessons.length !== lessonIds.length) {
      throw new NotFoundException(
        'One or more lesson IDs are invalid or do not belong to this module',
      );
    }

    // Update lesson orders
    await Promise.all(
      lessonIds.map((lessonId, index) => {
        return this.prisma.courseLesson.update({
          where: { id: lessonId },
          data: { order: index + 1 },
        });
      }),
    );

    return { message: 'Lessons reordered successfully' };
  }

  private async updateCourseDuration(courseId: string): Promise<void> {
    // Calculate total duration of all video lessons in the course
    const lessons = await this.prisma.courseLesson.findMany({
      where: {
        module: {
          courseId,
        },
        videoDuration: {
          gt: 0,
        },
      },
      select: {
        videoDuration: true,
      },
    });

    const totalSeconds = lessons.reduce((total, lesson) => {
      return total + (lesson.videoDuration || 0);
    }, 0);

    // Convert seconds to minutes and update course
    const totalMinutes = Math.ceil(totalSeconds / 60);

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalDuration: totalMinutes,
      },
    });
  }
}
