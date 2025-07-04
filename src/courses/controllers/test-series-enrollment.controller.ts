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
import { TestSeriesEnrollmentService } from '../services/test-series-enrollment.service';
import {
  TestSeriesEnrollmentResponseDto,
  TestSeriesEnrollmentStatsDto,
  UpdateTestSeriesEnrollmentDto,
} from '../dto/test-series-enrollment.dto';

@ApiTags('test-series-enrollments')
@Controller('test-series-enrollments')
@ApiBearerAuth()
export class TestSeriesEnrollmentController {
  constructor(
    private readonly testSeriesEnrollmentService: TestSeriesEnrollmentService,
  ) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all test series enrollments for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all test series enrollments for the current user',
    type: [TestSeriesEnrollmentResponseDto],
  })
  async findMyEnrollments(
    @CurrentUser() user: User,
  ): Promise<TestSeriesEnrollmentResponseDto[]> {
    return this.testSeriesEnrollmentService.findUserEnrollments(user.id);
  }

  @Get('my/ids')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all test series enrollment IDs for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all test series enrollment IDs for the current user',
    type: [String],
  })
  async findMyEnrollmentIds(@CurrentUser() user: User): Promise<string[]> {
    return this.testSeriesEnrollmentService.getUserTestSeriesEnrollmentIds(
      user.id,
    );
  }

  @Get('test-series/:testSeriesId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollments for a test series' })
  @ApiParam({ name: 'testSeriesId', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollments for a test series',
    type: [TestSeriesEnrollmentResponseDto],
  })
  async findTestSeriesEnrollments(
    @Param('testSeriesId') testSeriesId: string,
  ): Promise<TestSeriesEnrollmentResponseDto[]> {
    return this.testSeriesEnrollmentService.findTestSeriesEnrollments(
      testSeriesId,
    );
  }

  @Get('test-series/:testSeriesId/ids')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollment IDs for a test series' })
  @ApiParam({ name: 'testSeriesId', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all enrollment IDs for a test series',
    type: [String],
  })
  async findTestSeriesEnrollmentIds(
    @Param('testSeriesId') testSeriesId: string,
  ): Promise<string[]> {
    return this.testSeriesEnrollmentService.getTestSeriesEnrollmentIds(
      testSeriesId,
    );
  }

  @Get('test-series/:testSeriesId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get enrollment statistics for a test series' })
  @ApiParam({ name: 'testSeriesId', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return enrollment statistics for a test series',
    type: TestSeriesEnrollmentStatsDto,
  })
  async getEnrollmentStats(
    @Param('testSeriesId') testSeriesId: string,
  ): Promise<TestSeriesEnrollmentStatsDto> {
    return this.testSeriesEnrollmentService.getEnrollmentStats(testSeriesId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get test series enrollment by id' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return test series enrollment by id',
    type: TestSeriesEnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    // Check if user is the owner of the enrollment or has admin/teacher role
    const enrollment = await this.testSeriesEnrollmentService.findOne(id);

    // Additional access check could be added here
    // if (enrollment.userId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.TEACHER) {
    //   throw new ForbiddenException('You do not have permission to access this enrollment');
    // }

    return enrollment;
  }

  @Post('test-series/:testSeriesId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enroll current user in a test series' })
  @ApiParam({ name: 'testSeriesId', description: 'Test Series ID' })
  @ApiResponse({
    status: 201,
    description: 'User enrolled successfully',
    type: TestSeriesEnrollmentResponseDto,
  })
  async enrollUser(
    @Param('testSeriesId') testSeriesId: string,
    @Param('purchaseId') purchaseId: string,
    @Param('endDate') endDate: Date,
    @CurrentUser() user: User,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    return this.testSeriesEnrollmentService.createEnrollment(
      user.id,
      testSeriesId,
      purchaseId,
      endDate,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a test series enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiBody({ type: UpdateTestSeriesEnrollmentDto })
  @ApiResponse({
    status: 200,
    description: 'Enrollment updated successfully',
    type: TestSeriesEnrollmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateTestSeriesEnrollmentDto,
  ): Promise<TestSeriesEnrollmentResponseDto> {
    return this.testSeriesEnrollmentService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test series enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 204, description: 'Enrollment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.testSeriesEnrollmentService.remove(id);
  }
}
