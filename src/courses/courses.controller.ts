import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CourseService } from './services/course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourseType, User, UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CourseListDto, CourseDetailDto } from './dto/course.dto';
import { PaginatedResponse } from 'src/util/pagination';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CurrentUser } from 'src/auth/decorators';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all courses for specific user' })
  @ApiQuery({ name: 'type', enum: CourseType, required: false })
  @ApiResponse({
    status: 200,
    description: 'Return all courses',
    type: [CourseListDto],
  })
  async findCourses(
    @CurrentUser() user: User,
    @Query('type') type?: CourseType,
  ): Promise<CourseListDto[]> {
    const userId = user.id;

    if (type) {
      return this.courseService.findByType(type, userId);
    }

    return this.courseService.findCourses(userId);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get paginated courses with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', enum: CourseType, required: false })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isPremium', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Return paginated courses',
    type: Object,
  })
  async findAllPaginated(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize = 10,
    @Query('search') search?: string,
    @Query('type') type?: CourseType,
    @Query('subject') subject?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isPremium') isPremium?: boolean,
  ): Promise<PaginatedResponse<CourseListDto>> {
    const filters = {
      type,
      subject,
      isActive: isActive !== undefined ? isActive === true : undefined,
      isPremium: isPremium !== undefined ? isPremium === true : undefined,
    };

    return this.courseService.findAllPaginated(
      page,
      pageSize,
      search,
      filters,
      user.id,
      user.role,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseDetailDto,
  })
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
  ) {
    return this.courseService.create(user.id, createCourseDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course by id' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return course by id',
    type: CourseDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<CourseDetailDto> {
    const userId = user.id;
    return this.courseService.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User,
  ) {
    // TODO: Add check to ensure only the teacher who created the course or an admin can update it
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }

  @Get(':id/access')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user has access to a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Return access status' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async checkAccess(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ hasAccess: boolean }> {
    const userId = user.id;
    const hasAccess = await this.courseService.checkUserAccess(userId, id);
    return { hasAccess };
  }

  @Get('teacher/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all courses created by the teacher' })
  @ApiResponse({
    status: 200,
    description: 'Return all courses created by the teacher',
    type: [CourseListDto],
  })
  async getTeacherCourses(@CurrentUser() user: User): Promise<CourseListDto[]> {
    return this.courseService.getTeacherCourses(user.id);
  }
}
