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
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ExamService } from '../services';
import { CreateExamDto, UpdateExamDto, QueryExamDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('exams')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  // @ApiOperation({ summary: 'Create a new exam' })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'Exam created successfully',
  // })
  async create(@Request() req, @Body() createExamDto: CreateExamDto) {
    return await this.examService.create(req.user.id, createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exams with pagination and filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all exams',
  })
  async findAll(@Request() req, @Query() queryDto: QueryExamDto) {
    return await this.examService.findAll(queryDto, req.user.role, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exam by id' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the exam',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Exam not found' })
  async findOne(@Param('id') id: string) {
    return await this.examService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exam updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Exam not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return await this.examService.update(id, req.user.id, updateExamDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exam' })
  @ApiParam({ name: 'id', description: 'Exam ID' })
  @ApiResponse({ status: 204, description: 'Exam deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exam not found' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.examService.remove(id, req.user.id);
  }

  @Get('teacher/my-exams')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all exams created by the logged-in teacher' })
  @ApiResponse({
    status: 200,
    description: "Return teacher's exams",
  })
  async getMyExams(@Request() req, @Query() queryDto: QueryExamDto) {
    return await this.examService.getExamsByTeacher(req.user.id, queryDto);
  }

  @Get('test-series/:testSeriesId')
  @ApiOperation({ summary: 'Get all exams in a test series' })
  @ApiParam({ name: 'testSeriesId', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return exams in the test series',
  })
  async getExamsByTestSeries(
    @Param('testSeriesId') testSeriesId: string,
    @Query() queryDto: QueryExamDto,
  ) {
    return await this.examService.getExamsByTestSeries(testSeriesId, queryDto);
  }
}
