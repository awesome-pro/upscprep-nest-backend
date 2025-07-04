import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateModuleDto,
  ModuleResponseDto,
  UpdateModuleDto,
  ModuleQueryParamsDto,
} from '../dto/module.dto';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  async create(
    courseId: string,
    createModuleDto: CreateModuleDto,
  ): Promise<ModuleResponseDto> {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Create module
    const module = await this.prisma.courseModule.create({
      data: {
        courseId,
        title: createModuleDto.title,
        description: createModuleDto.description,
        order: createModuleDto.order,
        images: createModuleDto.images || [],
        isActive:
          createModuleDto.isActive !== undefined
            ? createModuleDto.isActive
            : true,
      },
    });

    // Update course total modules count
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalModules: {
          increment: 1,
        },
      },
    });

    return module;
  }

  async findAll(courseId: string): Promise<ModuleResponseDto[]> {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Get all modules for the course
    return this.prisma.courseModule.findMany({
      where: {
        courseId,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findAllPaginated(
    courseId: string,
    queryParams: ModuleQueryParamsDto,
  ): Promise<PaginatedResponse<ModuleResponseDto>> {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Build where clause based on query params
    const where: any = {
      courseId,
    };

    // Apply search if provided
    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
      ];
    }

    // Apply isActive filter if provided
    if (queryParams.isActive !== undefined) {
      where.isActive = queryParams.isActive;
    }

    // Count total matching modules
    const total = await this.prisma.courseModule.count({ where });

    // Get paginated modules
    const page = queryParams.page || 1;
    const pageSize = queryParams.pageSize || 10;

    const modules = await this.prisma.courseModule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: queryParams.orderBy
        ? { [queryParams.orderBy]: queryParams.orderDirection || 'asc' }
        : { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    // Transform to DTOs with lesson count
    const moduleDtos = modules.map((module) => ({
      ...module,
      lessonCount: module._count.lessons,
    }));

    return createPaginatedResponse(moduleDtos, total, pageSize, page);
  }

  async findOne(id: string): Promise<ModuleResponseDto> {
    const module = await this.prisma.courseModule.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    return module;
  }

  async update(
    id: string,
    updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    // Check if module exists
    const existingModule = await this.prisma.courseModule.findUnique({
      where: { id },
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // Update module
    return this.prisma.courseModule.update({
      where: { id },
      data: updateModuleDto,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if module exists
    const existingModule = await this.prisma.courseModule.findUnique({
      where: { id },
    });

    if (!existingModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }

    // Get course ID for updating total modules count
    const courseId = existingModule.courseId;

    // Delete module
    await this.prisma.courseModule.delete({
      where: { id },
    });

    // Update course total modules count
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalModules: {
          decrement: 1,
        },
      },
    });

    return { message: `Module with ID ${id} successfully deleted` };
  }

  async reorderModules(
    courseId: string,
    moduleIds: string[],
  ): Promise<{ message: string }> {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Validate that all module IDs belong to the course
    const modules = await this.prisma.courseModule.findMany({
      where: {
        courseId,
        id: {
          in: moduleIds,
        },
      },
    });

    if (modules.length !== moduleIds.length) {
      throw new NotFoundException(
        'One or more module IDs are invalid or do not belong to this course',
      );
    }

    // Update module orders
    await Promise.all(
      moduleIds.map((moduleId, index) => {
        return this.prisma.courseModule.update({
          where: { id: moduleId },
          data: { order: index + 1 },
        });
      }),
    );

    return { message: 'Modules reordered successfully' };
  }
}
