import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from 'generated/prisma';
import { CurrentUser } from '../../auth/decorators';
import { LessonService } from '../services/lesson.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
  LessonQueryParamsDto,
} from '../dto/lesson.dto';
import { PaginatedResponse } from '../../util/pagination';

@ApiTags('course-lessons')
@Controller('modules/:moduleId/lessons')
@ApiBearerAuth()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all lessons for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all lessons for a module',
    type: [LessonResponseDto],
  })
  async findAll(
    @Param('moduleId') moduleId: string,
  ): Promise<LessonResponseDto[]> {
    return this.lessonService.findAll(moduleId);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated lessons for a module with search and filters',
  })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated lessons for a module',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LessonResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            pageSize: { type: 'number' },
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  async findAllPaginated(
    @Param('moduleId') moduleId: string,
    @Query() queryParams: LessonQueryParamsDto,
  ): Promise<PaginatedResponse<LessonResponseDto>> {
    return this.lessonService.findAllPaginated(moduleId, queryParams);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get lesson by id' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({
    status: 200,
    description: 'Return lesson by id',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<LessonResponseDto> {
    return this.lessonService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new lesson for a module' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    type: LessonResponseDto,
  })
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.lessonService.create(moduleId, createLessonDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiBody({ type: UpdateLessonDto })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.lessonService.update(id, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.lessonService.remove(id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete lessons' })
  @ApiParam({ name: 'moduleId', description: 'Module ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of lesson IDs to delete',
        },
      },
    },
  })
  @ApiResponse({ status: 204, description: 'Lessons deleted successfully' })
  @ApiResponse({ status: 404, description: 'One or more lessons not found' })
  async bulkRemove(
    @Body() body: { ids: string[] },
  ): Promise<{ message: string }> {
    return this.lessonService.bulkRemove(body.ids);
  }
}
