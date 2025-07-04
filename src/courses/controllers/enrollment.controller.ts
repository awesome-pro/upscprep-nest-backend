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
import { EnrollmentService } from '../services/enrollment.service';
import {
  EnrollmentResponseDto,
  EnrollmentStatsDto,
  UpdateEnrollmentDto,
} from '../dto/enrollment.dto';

@ApiTags('course-enrollments')
@Controller('enrollments')
@ApiBearerAuth()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all enrollments for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollments for the current user',
    type: [EnrollmentResponseDto],
  })
  async findMyEnrollments(
    @CurrentUser() user: User,
  ): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentService.findUserEnrollments(user.id);
  }

  @Get('my/ids')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all enrollment IDs for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollment IDs for the current user',
    type: [String],
  })
  async findMyEnrollmentIds(@CurrentUser() user: User): Promise<string[]> {
    return this.enrollmentService.getUserEnrollmentIds(user.id);
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollments for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollments for a course',
    type: [EnrollmentResponseDto],
  })
  async findCourseEnrollments(
    @Param('courseId') courseId: string,
  ): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentService.findCourseEnrollments(courseId);
  }

  @Get('course/:courseId/ids')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollment IDs for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollment IDs for a course',
    type: [String],
  })
  async findCourseEnrollmentIds(
    @Param('courseId') courseId: string,
  ): Promise<string[]> {
    return this.enrollmentService.getCourseEnrollmentIds(courseId);
  }

  @Get('course/:courseId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get enrollment statistics for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return enrollment statistics for a course',
    type: EnrollmentStatsDto,
  })
  async getEnrollmentStats(
    @Param('courseId') courseId: string,
  ): Promise<EnrollmentStatsDto> {
    return this.enrollmentService.getEnrollmentStats(courseId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get enrollment by id' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return enrollment by id',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<EnrollmentResponseDto> {
    // Check if user is the owner of the enrollment or has admin/teacher role
    const enrollment = await this.enrollmentService.findOne(id);

    // Additional access check could be added here
    // if (enrollment.userId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.TEACHER) {
    //   throw new ForbiddenException('You do not have permission to access this enrollment');
    // }

    return enrollment;
  }

  @Post('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enroll current user in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 201,
    description: 'User enrolled successfully',
    type: EnrollmentResponseDto,
  })
  async enrollUser(
    @Param('courseId') courseId: string,
    @Param('purchaseId') purchaseId: string,
    @Param('endDate') endDate: Date,
    @CurrentUser() user: User,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.createEnrollment(
      user.id,
      courseId,
      purchaseId,
      endDate,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiBody({ type: UpdateEnrollmentDto })
  @ApiResponse({
    status: 200,
    description: 'Enrollment updated successfully',
    type: EnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 204, description: 'Enrollment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.enrollmentService.remove(id);
  }
}
