import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TestSeriesService } from '../services';
import {
  CreateTestSeriesDto,
  UpdateTestSeriesDto,
  QueryTestSeriesDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TestSeries, User, UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaginatedResponse } from 'src/util/pagination';
import { CurrentUser } from 'src/auth/decorators';

@ApiTags('test-series')
@Controller('test-series')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new test series' })
  @ApiResponse({
    status: 201,
    description: 'Test series created successfully',
  })
  async create(
    @Request() req,
    @Body() createTestSeriesDto: CreateTestSeriesDto,
  ) {
    return await this.testSeriesService.create(
      req.user.id,
      createTestSeriesDto,
    );
  }

  @Get('')
  @ApiOperation({
    summary: 'Get all test series with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all test series',
  })
  async findAll(
    @Query() queryDto: QueryTestSeriesDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponse<TestSeries>> {
    return await this.testSeriesService.findAll(queryDto, user.role, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a test series by id' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the test series',
  })
  @ApiResponse({ status: 404, description: 'Test series not found' })
  async findOne(@Param('id') id: string) {
    return await this.testSeriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a test series' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Test series updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Test series not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTestSeriesDto: UpdateTestSeriesDto,
  ) {
    return await this.testSeriesService.update(
      id,
      req.user.id,
      updateTestSeriesDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a test series' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiResponse({ status: 204, description: 'Test series deleted successfully' })
  @ApiResponse({ status: 404, description: 'Test series not found' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.testSeriesService.remove(id, req.user.id);
  }

  @Get('teacher/my-test-series')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get all test series associated with the logged-in teacher',
  })
  @ApiResponse({
    status: 200,
    description: "Return teacher's test series",
  })
  async getMyTestSeries(@Request() req, @Query() queryDto: QueryTestSeriesDto) {
    return await this.testSeriesService.getTestSeriesByTeacher(
      req.user.id,
      queryDto,
      req.user.role,
      req.user.id,
    );
  }

  @Post(':id/exams/:examId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add an exam to a test series' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({
    status: 200,
    description: 'Exam added to test series successfully',
  })
  async addExamToTestSeries(
    @Request() req,
    @Param('id') id: string,
    @Param('examId') examId: string,
  ) {
    return await this.testSeriesService.addExamToTestSeries(
      id,
      examId,
      req.user.id,
    );
  }

  @Delete(':id/exams/:examId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove an exam from a test series' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({
    status: 200,
    description: 'Exam removed from test series successfully',
  })
  async removeExamFromTestSeries(
    @Request() req,
    @Param('id') id: string,
    @Param('examId') examId: string,
  ) {
    return await this.testSeriesService.removeExamFromTestSeries(
      id,
      examId,
      req.user.id,
    );
  }
}
